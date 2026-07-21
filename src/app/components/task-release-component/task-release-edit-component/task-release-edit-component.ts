import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { UpdateTaskReleaseRequest } from '../../../models/task.model';
import { IAuthService, LoadingState } from '../../../models/auth';
import { TaskReleaseService } from '../../../services/task-release.service';

@Component({
  selector: 'app-task-release-edit',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, InputTextModule, TextareaModule,
    DatePickerModule, ToastModule, ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './task-release-edit-component.html',
  styleUrls: ['./task-release-edit-component.scss'],
})
export class TaskReleaseEditComponent implements OnInit {
  private taskReleaseService = inject(TaskReleaseService);
  private msgService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // RBAC access control
  private readonly MODULE_ID       = 'mod24';
  private readonly ADD_ACCESS_CODE = 'a2402.01'; // control edit access

  constructor(
    @Inject('AUTH_SERVICE') private authService: IAuthService,
  ) {}

  LoadingState = LoadingState;
  loadingState = signal<LoadingState>(LoadingState.Loading);
  releaseId = signal<number | null>(null);

  // ── Form fields ─────────────────────────────────────────────────────
  releaseIdField = signal('');
  releaseVersion = signal('');
  releaseDate: Date | null = null;
  releaseRemarks = signal('');

  submitting = signal(false);

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!idParam || isNaN(id)) {
      this.msgService.add({ severity: 'error', summary: 'Invalid task release', life: 3000 });
      this.router.navigateByUrl('/job-tasks/release');
      return;
    }
    this.releaseId.set(id);

    try {
      const accesses = await this.authService.fetchGroupAuthorityAccesses(this.MODULE_ID);
      const canEdit = accesses.some(a => a.accessCode === this.ADD_ACCESS_CODE && a.accessValue);
      if (!canEdit) {
        this.msgService.add({ severity: 'error', summary: 'You do not have permission to edit task releases', life: 3000 });
        this.router.navigateByUrl('/job-tasks/release');
        return;
      }
    } catch (e) {
      console.warn('[TaskReleaseEdit] RBAC fetch failed — denying edit access', e);
      this.msgService.add({ severity: 'error', summary: 'You do not have permission to edit task releases', life: 3000 });
      this.router.navigateByUrl('/job-tasks/release');
      return;
    }

    this.loadDetail(id);
  }

  private loadDetail(id: number) {
    this.loadingState.set(LoadingState.Loading);
    this.taskReleaseService.getDetail(id).subscribe({
      next: data => {
        this.releaseIdField.set(data.releaseId);
        this.releaseVersion.set(data.releaseVersion);
        this.releaseDate = data.releaseDate ? new Date(data.releaseDate) : null;
        this.releaseRemarks.set(data.releaseRemarks ?? '');
        this.loadingState.set(LoadingState.Success);
      },
      error: e => {
        console.error('[TaskReleaseEdit] loadDetail error', e);
        this.loadingState.set(LoadingState.Error);
      },
    });
  }

  canSubmit(): boolean {
    return this.releaseIdField().trim().length > 0
      && this.releaseVersion().trim().length > 0
      && this.releaseDate !== null
      && !this.submitting();
  }

  submit() {
    if (!this.canSubmit()) return;
    const id = this.releaseId();
    if (!id) return;

    this.submitting.set(true);

    const req: UpdateTaskReleaseRequest = {
      releaseId:      this.releaseIdField().trim(),
      releaseDate:    this.toLocalDateStr(this.releaseDate)!,
      releaseVersion: this.releaseVersion().trim(),
      releaseRemarks: this.releaseRemarks().trim() || undefined,
      lastEditStaff:  this.getLoggedInStaffId() ?? undefined,
    };

    this.taskReleaseService.update(id, req).subscribe({
      next: () => {
        this.submitting.set(false);
        this.msgService.add({ severity: 'success', summary: 'Task release updated!', life: 2000 });
        this.router.navigateByUrl(`/job-tasks/release/view/${id}`);
      },
      error: e => {
        console.error('[TaskReleaseEdit] update error', e);
        this.submitting.set(false);
        this.msgService.add({ severity: 'error', summary: 'Failed to update task release', life: 3000 });
      },
    });
  }

  cancel() {
    const id = this.releaseId();
    this.router.navigateByUrl(id ? `/job-tasks/release/view/${id}` : '/job-tasks/release');
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
