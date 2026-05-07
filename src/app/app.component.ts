import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { CreateJobTaskRequest, FilterState, JobTask, Staff, Status } from './models/task.model';
import { TaskService } from './services/task.service';
import { StaffService } from './services/staff.service';

import { AvatarComponent } from './components/avatar/avatar.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { UserSwitcherComponent } from './components/user-switcher/user-switcher.component';
import { FilterPopoverComponent } from './components/filter-popover/filter-popover.component';
import { TaskCardComponent } from './components/task-card/task-card.component';
import { TaskFormModalComponent } from './components/task-form-modal/task-form-modal.component';
import { TaskDetailDrawerComponent } from './components/task-detail-drawer/task-detail-drawer.component';

@Component({
  selector: 'app-root',
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    AvatarComponent,
    StatCardComponent,
    UserSwitcherComponent,
    FilterPopoverComponent,
    TaskCardComponent,
    TaskFormModalComponent,
    TaskDetailDrawerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private taskService = inject(TaskService);
  private staffService = inject(StaffService);

  // ──── Signals ────
  staff = signal<Staff[]>([]);
  tasks = signal<JobTask[]>([]);
  me = signal<Staff | null>(null);
  selectedTask = signal<JobTask | null>(null);
  showTaskForm = signal(false);
  showTaskDetail = signal(false);
  searchQuery = signal('');
  filterState = signal<FilterState>({ groupAuthority: 'ALL', staffCode: '' });
  loading = signal(false);

  // ──── Computed Values ────
  filteredTasks = computed(() => {
    let filtered = this.tasks();

    // Search filter
    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.taskTitle?.toLowerCase().includes(q) ||
          t.taskDescription?.toLowerCase().includes(q) ||
          t.jobTaskId?.toLowerCase().includes(q)
      );
    }

    // Filter by group authority
    const filter = this.filterState();
    if (filter.groupAuthority === 'ASSIGNED_BY_ME') {
      filtered = filtered.filter((t) => t.assignor?.staffCode === this.me()?.staffCode);
    } else if (filter.groupAuthority === 'ASSIGNED_TO_ME') {
      filtered = filtered.filter((t) => t.assignee?.staffCode === this.me()?.staffCode);
    }

    return filtered;
  });

  // Statistics
  activeCount = computed(() => {
    return this.tasks().filter((t) => t.jobStatus === 'IN_PROGRESS' || t.jobStatus === 'PENDING').length;
  });

  completedCount = computed(() => {
    return this.tasks().filter((t) => t.jobStatus === 'COMPLETED').length;
  });

  overdueCount = computed(() => {
    const now = new Date();
    return this.tasks().filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < now &&
        (t.jobStatus === 'PENDING' || t.jobStatus === 'IN_PROGRESS')
    ).length;
  });

  totalCount = computed(() => this.tasks().length);

  // Filter tab counts
  assignedByMeCount = computed(() => {
    return this.tasks().filter((t) => t.assignor?.staffCode === this.me()?.staffCode).length;
  });

  assignedToMeCount = computed(() => {
    return this.tasks().filter((t) => t.assignee?.staffCode === this.me()?.staffCode).length;
  });

  allCount = computed(() => this.tasks().length);

  // Filter tabs
  filterTabs = [
    { label: 'I assigned', key: 'ASSIGNED_BY_ME', count: this.assignedByMeCount },
    { label: 'Assigned to me', key: 'ASSIGNED_TO_ME', count: this.assignedToMeCount },
    { label: 'All', key: 'ALL', count: this.allCount },
  ];

  ngOnInit() {
    this.loadStaff();
    this.loadTasks();
  }

  private loadStaff() {
    this.staffService.getStaff().subscribe({
      next: (staffList) => {
        this.staff.set(staffList);
        // Set first staff as me
        if (staffList.length > 0) {
          this.me.set(staffList[0]);
        }
      },
    });
  }

  private loadTasks() {
    this.loading.set(true);
    this.taskService.getTasks().subscribe({
      next: (taskList) => {
        this.tasks.set(taskList);
        this.loading.set(false);
      },
    });
  }

  onSelectStaff(staff: Staff) {
    this.me.set(staff);
    this.loadTasks();
  }

  onFilterChange(key: string) {
    const state = this.filterState();
    this.filterState.set({ ...state, groupAuthority: key as any });
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
  }

  onOpenTaskForm() {
    this.showTaskForm.set(true);
  }

  onCloseTaskForm() {
    this.showTaskForm.set(false);
  }

  onCreateTask(data: CreateJobTaskRequest) {
    this.taskService.createTask(data).subscribe({
      next: () => {
        this.showTaskForm.set(false);
        this.loadTasks();
      },
    });
  }

  onSelectTask(task: JobTask) {
    this.selectedTask.set(task);
    this.showTaskDetail.set(true);
  }

  onCloseTaskDetail() {
    this.showTaskDetail.set(false);
    this.selectedTask.set(null);
  }

  onDeleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId).subscribe({
        next: () => {
          this.showTaskDetail.set(false);
          this.selectedTask.set(null);
          this.loadTasks();
        },
      });
    }
  }

  onTaskStatusChanged() {
    this.loadTasks();
  }
}
