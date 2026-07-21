import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';

import { JobTask, Status } from '../../../../models/task.model';
import { TaskReleaseService } from '../../../../services/task-release.service';

@Component({
  selector: 'app-task-release-add-tasks',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, InputTextModule,
    MultiSelectModule, TableModule, ToastModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './task-release-add-tasks-component.html',
  styleUrls: ['./task-release-add-tasks-component.scss'],
})
export class TaskReleaseAddTasksComponent implements OnInit {
  private taskReleaseService = inject(TaskReleaseService);
  private msgService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  releaseId = signal<number | null>(null);

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
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!idParam || isNaN(id)) {
      this.msgService.add({ severity: 'error', summary: 'Invalid task release', life: 3000 });
      this.router.navigateByUrl('/job-tasks/release');
      return;
    }
    this.releaseId.set(id);

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
        console.error('[TaskReleaseAddTasks] getReleasableJobTasks error', e);
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

  canSubmit(): boolean {
    return this.selectedTasks().length > 0 && !this.submitting();
  }

  submit() {
    if (!this.canSubmit()) return;
    const id = this.releaseId();
    if (!id) return;

    this.submitting.set(true);
    const jobTaskIds = this.selectedTasks().map(t => t.uniqId);

    this.taskReleaseService.addJobTasks(id, jobTaskIds).subscribe({
      next: () => {
        this.submitting.set(false);
        this.msgService.add({ severity: 'success', summary: 'Job tasks added to release!', life: 2000 });
        this.router.navigateByUrl(`/job-tasks/release/view/${id}`);
      },
      error: e => {
        console.error('[TaskReleaseAddTasks] addJobTasks error', e);
        this.submitting.set(false);
        this.msgService.add({ severity: 'error', summary: 'Failed to add job tasks', life: 3000 });
      },
    });
  }

  cancel() {
    const id = this.releaseId();
    this.router.navigateByUrl(id ? `/job-tasks/release/view/${id}` : '/job-tasks/release');
  }
}
