import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ListboxModule } from 'primeng/listbox';

import { JobTask, Staff, Status, TaskType, Priority, CreateJobTaskRequest } from './models/task.model';
import { TaskService } from './services/task.service';
import { StaffService } from './services/staff.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, InputTextModule, TagModule, BadgeModule,
    DialogModule, SelectButtonModule, ToastModule, AvatarModule,
    DividerModule, DatePickerModule, TextareaModule, SelectModule, ListboxModule,
  ],
  providers: [MessageService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private taskService  = inject(TaskService);
  private staffService = inject(StaffService);
  private msgService   = inject(MessageService);

  // ── State ──────────────────────────────────────────────────────────────────
  staff       = signal<Staff[]>([]);
  tasks       = signal<JobTask[]>([]);
  me          = signal<Staff | null>(null);
  activeView  = signal<'ALL' | 'ASSIGNED_BY_ME' | 'ASSIGNED_TO_ME'>('ALL');
  searchQuery = signal('');
  loading     = signal(false);

  // Detail dialog
  showDetail    = signal(false);
  selectedTask  = signal<JobTask | null>(null);

  // Create wizard
  showWizard  = signal(false);
  wizardStep  = signal(1);
  newTitle    = signal('');
  newType     = signal<TaskType | ''>('');
  newAssignee = signal<Staff | null>(null);
  newPriority = signal<Priority>('Medium');
  newDueDate: Date | null = null;
  newDesc     = signal('');

  // Status options
  statusOptions = [
    { label: 'Pending',     value: 'Pending' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'On Hold',     value: 'On Hold' },
    { label: 'Completed',   value: 'Completed' },
  ];

  taskTypes: TaskType[] = [
    'Software Development', 'Job Support', 'System Enquiries',
    'Technical Support', 'Bug Fix', 'Documentation',
  ];

  priorities: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

  viewTabs = [
    { label: 'All',            value: 'ALL' },
    { label: 'I assigned',     value: 'ASSIGNED_BY_ME' },
    { label: 'Assigned to me', value: 'ASSIGNED_TO_ME' },
  ];

  // ── Computed ───────────────────────────────────────────────────────────────
  filteredTasks = computed(() => {
    let list = this.tasks();
    const q  = this.searchQuery().toLowerCase().trim();
    const me = this.me();
    const v  = this.activeView();

    if (v === 'ASSIGNED_BY_ME' && me)
      list = list.filter(t => t.assignor?.staffCode === me.staffCode);
    if (v === 'ASSIGNED_TO_ME' && me)
      list = list.filter(t => t.assignee?.staffCode === me.staffCode);
    if (q) list = list.filter(t =>
      t.taskTitle.toLowerCase().includes(q) ||
      t.jobTaskId?.toLowerCase().includes(q) ||
      (t.taskDescription ?? '').toLowerCase().includes(q));
    return list;
  });

  stats = computed(() => {
    const all  = this.tasks();
    const now  = new Date(); now.setHours(0,0,0,0);
    return {
      active:    all.filter(t => t.jobStatus === 'In Progress' || t.jobStatus === 'Pending').length,
      completed: all.filter(t => t.jobStatus === 'Completed').length,
      overdue:   all.filter(t =>
        t.jobStatus !== 'Completed' && t.jobStatus !== 'Cancelled' &&
        t.dueDate != null && new Date(t.dueDate) < now).length,
      total:     all.length,
    };
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.loadStaff();
    this.loadTasks();
  }

  loadStaff() {
    this.staffService.list().subscribe({
      next: list => {
        this.staff.set(list);
        // Identify logged-in user from JWT stored in localStorage by the shell
        const loggedInStaffId = this.getLoggedInStaffId();
        const currentUser = loggedInStaffId
          ? list.find(s => s.staffId === loggedInStaffId) ?? list[0]
          : list[0];
        this.me.set(currentUser ?? null);
      },
      error: e => console.error('loadStaff error', e),
    });
  }

  /** Read staffId from shell JWT token in localStorage */
  private getLoggedInStaffId(): string | null {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      // JWT payload is the second segment, base64-encoded
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded?.staffId || decoded?.secLoginId || decoded?.sub || null;
    } catch {
      return null;
    }
  }

  private loadTasks() {
    this.loading.set(true);
    this.taskService.list().subscribe({
      next:  list  => { this.tasks.set(list); this.loading.set(false); },
      error: e     => { console.error('loadTasks error', e); this.loading.set(false); },
    });
  }

  // ── Interactions ───────────────────────────────────────────────────────────
  openTask(task: JobTask) {
    this.selectedTask.set(task);
    this.showDetail.set(true);
  }

  onStatusChange(task: JobTask, status: Status) {
    this.taskService.updateStatus(task.uniqId, status, String(this.me()?.staffCode ?? '')).subscribe({
      next: updated => {
        this.tasks.update(list => list.map(t => t.uniqId === updated.uniqId ? updated : t));
        this.selectedTask.set(updated);
        this.msgService.add({ severity: 'success', summary: 'Status updated', life: 2000 });
      },
      error: e => { console.error(e); this.msgService.add({ severity: 'error', summary: 'Failed to update status', life: 3000 }); },
    });
  }

  onDeleteTask() {
    const task = this.selectedTask();
    if (!task) return;
    if (!confirm('Delete this task?')) return;
    this.taskService.delete(task.uniqId).subscribe({
      next: () => {
        this.tasks.update(list => list.filter(t => t.uniqId !== task.uniqId));
        this.showDetail.set(false);
        this.msgService.add({ severity: 'success', summary: 'Task deleted', life: 2000 });
      },
    });
  }

  // Wizard
  openWizard() {
    this.wizardStep.set(1);
    this.newTitle.set(''); this.newType.set(''); this.newAssignee.set(null);
    this.newPriority.set('Medium'); this.newDueDate = null; this.newDesc.set('');
    // Reload staff if empty (e.g. initial CORS-blocked load)
    if (this.staff().length === 0) this.loadStaff();
    this.showWizard.set(true);
  }

  wizardNext() { if (this.wizardStep() < 3) this.wizardStep.update(s => s + 1); }
  wizardBack() { if (this.wizardStep() > 1) this.wizardStep.update(s => s - 1); }

  canNext(): boolean {
    if (this.wizardStep() === 1) return this.newTitle().trim().length > 0 && this.newType() !== '';
    if (this.wizardStep() === 2) return this.newAssignee() !== null;
    return true;
  }

  submitTask() {
    const me       = this.me();
    const assignee = this.newAssignee();
    if (!me || !assignee) return;

    const req: CreateJobTaskRequest = {
      taskTitle:       this.newTitle().trim(),
      taskType:        this.newType() as TaskType,
      taskDescription: this.newDesc(),
      assignorStaffId: me.staffCode,
      assigneeStaffId: assignee.staffCode,
      priority:        this.newPriority(),
      dueDate:         this.newDueDate ? this.newDueDate.toISOString().split('T')[0] : null,
      entryStaff:      me.staffId,
    };

    this.taskService.create(req).subscribe({
      next: created => {
        this.tasks.update(list => [created, ...list]);
        this.showWizard.set(false);
        this.msgService.add({ severity: 'success', summary: 'Task created!', life: 2000 });
      },
      error: e => { console.error(e); this.msgService.add({ severity: 'error', summary: 'Failed to create task', life: 3000 }); },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  prioritySeverity(p: string): 'danger' | 'warn' | 'info' | 'secondary' {
    if (p === 'Urgent') return 'danger';
    if (p === 'High')   return 'warn';
    if (p === 'Medium') return 'info';
    return 'secondary';
  }

  statusSeverity(s: string): 'success' | 'warn' | 'info' | 'secondary' | 'danger' {
    if (s === 'Completed')   return 'success';
    if (s === 'In Progress') return 'warn';
    if (s === 'On Hold')     return 'secondary';
    if (s === 'Cancelled')   return 'danger';
    return 'info';
  }

  isOverdue(task: JobTask): boolean {
    if (!task.dueDate || task.jobStatus === 'Completed' || task.jobStatus === 'Cancelled') return false;
    const now = new Date(); now.setHours(0,0,0,0);
    return new Date(task.dueDate) < now;
  }

  initials(name: string | null | undefined): string {
    if (!name) return '?';
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
