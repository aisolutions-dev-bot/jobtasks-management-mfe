import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { JobTask, TaskReleaseDetail } from '../../../models/task.model';
import { IAuthService, LoadingState } from '../../../models/auth';
import { TaskReleaseService } from '../../../services/task-release.service';

@Component({
  selector: 'app-task-release-view',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    CardModule, ButtonModule, TableModule, ProgressSpinnerModule,
    ToastModule, ConfirmDialogModule, TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './task-release-view-component.html',
  styleUrls: ['./task-release-view-component.scss'],
})
export class TaskReleaseViewComponent implements OnInit {
  private taskReleaseService = inject(TaskReleaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private msgService = inject(MessageService);

  // RBAC access control
  private readonly MODULE_ID       = 'mod24';
  private readonly ADD_ACCESS_CODE = 'a2402.01'; // gates edit/delete/add-tasks/remove-task

  LoadingState = LoadingState;
  loadingState = signal<LoadingState>(LoadingState.Loading);
  releaseId = signal<number | null>(null);
  detail = signal<TaskReleaseDetail | null>(null);
  jobTasks = signal<JobTask[]>([]);
  canEdit = signal(false);

  constructor(
    @Inject('AUTH_SERVICE') private authService: IAuthService,
  ) {}

  async ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!idParam || isNaN(id)) {
      this.msgService.add({ severity: 'error', summary: 'Invalid task release', life: 3000 });
      this.router.navigateByUrl('/job-tasks/release');
      return;
    }
    this.releaseId.set(id);

    this.loadDetail(id);

    try {
      const accesses = await this.authService.fetchGroupAuthorityAccesses(this.MODULE_ID);
      this.canEdit.set(accesses.some(a => a.accessCode === this.ADD_ACCESS_CODE && a.accessValue));
    } catch (e) {
      console.warn('[TaskReleaseView] RBAC fetch failed — defaulting to no edit access', e);
      this.canEdit.set(false);
    }
  }

  private loadDetail(id: number) {
    this.loadingState.set(LoadingState.Loading);
    this.taskReleaseService.getDetail(id).subscribe({
      next: data => {
        this.detail.set(data);
        this.jobTasks.set(data.jobTasks ?? []);
        this.loadingState.set(LoadingState.Success);
      },
      error: e => {
        console.error('[TaskReleaseView] loadDetail error', e);
        this.loadingState.set(LoadingState.Error);
      },
    });
  }

  confirmRemoveTask(task: JobTask) {
    this.confirmationService.confirm({
      header: 'Remove Job Task',
      message: `Remove job task <strong>${task.jobTaskId}</strong> from this release?`,
      icon: 'pi pi-trash',
      acceptLabel: 'Remove',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.removeTask(task),
    });
  }

  private removeTask(task: JobTask) {
    const id = this.releaseId();
    if (!id) return;

    this.taskReleaseService.removeJobTask(id, task.uniqId).subscribe({
      next: () => {
        this.jobTasks.update(list => list.filter(t => t.uniqId !== task.uniqId));
        this.detail.update(d => d ? { ...d, taskCount: Math.max(0, d.taskCount - 1) } : d);
        this.msgService.add({ severity: 'success', summary: 'Job task removed from release', life: 2000 });
      },
      error: e => {
        console.error('[TaskReleaseView] removeTask error', e);
        this.msgService.add({ severity: 'error', summary: 'Failed to remove job task', life: 3000 });
      },
    });
  }

  confirmDeleteRelease() {
    this.confirmationService.confirm({
      header: 'Delete Task Release',
      message: 'This will permanently delete this task release and unlink all its job tasks. This action cannot be undone. Continue?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteRelease(),
    });
  }

  private deleteRelease() {
    const id = this.releaseId();
    if (!id) return;

    this.taskReleaseService.deleteRelease(id).subscribe({
      next: () => {
        this.msgService.add({ severity: 'success', summary: 'Task release deleted', life: 2000 });
        this.router.navigateByUrl('/job-tasks/release');
      },
      error: e => {
        console.error('[TaskReleaseView] deleteRelease error', e);
        this.msgService.add({ severity: 'error', summary: 'Failed to delete task release', life: 3000 });
      },
    });
  }
}
