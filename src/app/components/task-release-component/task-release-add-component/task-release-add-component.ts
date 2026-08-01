import { Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { CreateTaskReleaseRequest, JobTask, Status } from '../../../models/task.model';
import { IAuthService } from '../../../models/auth';
import { TaskReleaseService } from '../../../services/task-release.service';
import { SystemVersionService } from '../services/system-version.service';

@Component({
  selector: 'app-task-release-add',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    CardModule, ButtonModule, InputTextModule, TextareaModule,
    DatePickerModule, MultiSelectModule, Select, TableModule, ToastModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './task-release-add-component.html',
  styleUrls: ['./task-release-add-component.scss'],
})
export class TaskReleaseAddComponent implements OnInit {
  private taskReleaseService = inject(TaskReleaseService);
  private systemVersionService = inject(SystemVersionService);
  private msgService = inject(MessageService);
  private router = inject(Router);

  constructor(
    @Inject('AUTH_SERVICE') private authService: IAuthService,
  ) {}

  // ── Form fields ─────────────────────────────────────────────────────
  /** Preview only, populated from the server; the real value is assigned at creation time. */
  releaseId      = signal<string | null>(null);
  releaseType    = signal<'MAJOR' | 'MINOR' | 'PATCH' | null>(null);
  currentVersion = signal<string | null>(null);
  releaseDate: Date | null = new Date();
  releaseRemarks = signal('');

  readonly releaseTypeOptions = [
    { label: 'Major', value: 'MAJOR' as const },
    { label: 'Minor', value: 'MINOR' as const },
    { label: 'Patch', value: 'PATCH' as const },
  ];

  nextVersionPreview = computed(() => {
    const current = this.currentVersion();
    const type = this.releaseType();
    if (!current || !type) return null;
    const hasVPrefix = current.startsWith('v') || current.startsWith('V');
    const numericPart = hasVPrefix ? current.slice(1) : current;
    const [major, minor, patch] = numericPart.split('.').map(Number);
    if ([major, minor, patch].some(Number.isNaN)) return null;
    const prefix = hasVPrefix ? 'v' : '';
    if (type === 'MAJOR') return `${prefix}${major + 1}.0.0`;
    if (type === 'MINOR') return `${prefix}${major}.${minor + 1}.0`;
    return `${prefix}${major}.${minor}.${patch + 1}`;
  });

  // ── Status filter + search ──────────────────────────────────────────
  readonly statusFilterOptions: { label: string; value: Status }[] = [
    { label: 'Completed', value: 'Completed' },
    { label: 'Tested',    value: 'Tested'    },
    { label: 'Closed',    value: 'Closed'    },
  ];
  selectedStatuses = signal<Status[]>(['Tested']);
  searchQuery      = signal('');

  private searchSubject = new Subject<{ statuses: Status[]; search: string }>();

  // ── Releasable job tasks ────────────────────────────────────────────
  releasableTasks = signal<JobTask[]>([]);
  selectedTasks   = signal<JobTask[]>([]);
  loadingTasks    = signal(false);

  submitting = signal(false);

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => a.search === b.search && a.statuses.join(',') === b.statuses.join(',')),
      switchMap(({ statuses, search }) => {
        this.loadingTasks.set(true);
        return this.taskReleaseService.getReleasableJobTasks(statuses, search);
      }),
    ).subscribe({
      next: list => {
        this.releasableTasks.set(list);
        // Drop any previously selected tasks that fell out of the new result set
        const ids = new Set(list.map(t => t.uniqId));
        this.selectedTasks.update(sel => sel.filter(t => ids.has(t.uniqId)));
        this.loadingTasks.set(false);
      },
      error: e => {
        console.error('[TaskReleaseAdd] getReleasableJobTasks error', e);
        this.loadingTasks.set(false);
        this.msgService.add({ severity: 'error', summary: 'Failed to load job tasks', life: 3000 });
      },
    });

    this.fetchReleasableTasks();

    this.systemVersionService.getCurrentVersion().subscribe({
      next: (v) => this.currentVersion.set(v.versionNumber),
      error: () => this.currentVersion.set(null),
    });

    this.taskReleaseService.getNextReleaseId().subscribe({
      next: (r) => this.releaseId.set(r.releaseId),
      error: () => this.releaseId.set(null),
    });
  }

  onStatusesChange() {
    this.fetchReleasableTasks();
  }

  onSearchChange() {
    this.fetchReleasableTasks();
  }

  private fetchReleasableTasks() {
    this.searchSubject.next({ statuses: this.selectedStatuses(), search: this.searchQuery().trim() });
  }

  // ── Validation ───────────────────────────────────────────────────────
  canSubmit(): boolean {
    return this.releaseType() !== null
      && this.releaseDate !== null
      && this.selectedTasks().length > 0
      && !this.submitting();
  }

  // ── Submit ───────────────────────────────────────────────────────────
  submit() {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    const req: CreateTaskReleaseRequest = {
      releaseDate:    this.toLocalDateStr(this.releaseDate)!,
      releaseType:    this.releaseType()!,
      releaseRemarks: this.releaseRemarks().trim() || undefined,
      entryStaff:     this.getLoggedInStaffId() ?? undefined,
      jobTaskIds:     this.selectedTasks().map(t => t.uniqId),
    };

    this.taskReleaseService.create(req).subscribe({
      next: () => {
        this.submitting.set(false);
        this.msgService.add({ severity: 'success', summary: 'Task release created!', life: 2000 });
        this.router.navigateByUrl('/job-tasks/release');
      },
      error: () => {
        this.submitting.set(false);
        this.msgService.add({ severity: 'error', summary: 'Failed to create task release', life: 3000 });
      },
    });
  }

  cancel() {
    this.router.navigateByUrl('/job-tasks/release');
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  /** Read staffId from auth service, falling back to shell JWT token in localStorage */
  private getLoggedInStaffId(): string | null {
    try {
      const staffId = this.authService.userRole()?.staffId;
      if (staffId) return staffId;
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded?.staffId || decoded?.secLoginId || decoded?.sub || null;
    } catch {
      return null;
    }
  }

  /** Formats a Date using local timezone — avoids UTC shift from toISOString() */
  toLocalDateStr(d: Date | null): string | null {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
