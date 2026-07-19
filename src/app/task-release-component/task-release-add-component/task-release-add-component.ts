import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { CreateTaskReleaseRequest, JobTask, Status } from '../../models/task.model';
import { IAuthService } from '../../models/auth';
import { TaskReleaseService } from '../../services/task-release.service';

@Component({
  selector: 'app-task-release-add',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, InputTextModule, TextareaModule,
    DatePickerModule, MultiSelectModule, TableModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './task-release-add-component.html',
  styleUrls: ['./task-release-add-component.scss'],
})
export class TaskReleaseAddComponent implements OnInit {
  private taskReleaseService = inject(TaskReleaseService);
  private msgService = inject(MessageService);
  private router = inject(Router);

  constructor(
    @Inject('AUTH_SERVICE') private authService: IAuthService,
  ) {}

  // ── Form fields ─────────────────────────────────────────────────────
  releaseId      = signal('');
  releaseVersion = signal('');
  releaseDate: Date | null = new Date();
  releaseRemarks = signal('');

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
    return this.releaseId().trim().length > 0
      && this.releaseVersion().trim().length > 0
      && this.releaseDate !== null
      && this.selectedTasks().length > 0
      && !this.submitting();
  }

  // ── Submit ───────────────────────────────────────────────────────────
  submit() {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    const req: CreateTaskReleaseRequest = {
      releaseId:      this.releaseId().trim(),
      releaseDate:    this.toLocalDateStr(this.releaseDate)!,
      releaseVersion: this.releaseVersion().trim(),
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
