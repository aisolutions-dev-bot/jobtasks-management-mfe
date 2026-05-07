import { CommonModule }                from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule }                  from '@angular/forms';
import { LucideAngularModule }          from 'lucide-angular';
import { firstValueFrom }               from 'rxjs';

import { CreateJobTaskRequest, FilterState, JobTask, Staff, Status, ViewMode } from './models/task.model';

import { TaskService }   from './services/task.service';
import { StaffService }  from './services/staff.service';

import { AvatarComponent }            from './components/avatar/avatar.component';
import { StatCardComponent }          from './components/stat-card/stat-card.component';
import { UserSwitcherComponent }      from './components/user-switcher/user-switcher.component';
import { FilterPopoverComponent }     from './components/filter-popover/filter-popover.component';
import { TaskCardComponent }          from './components/task-card/task-card.component';
import { TaskFormModalComponent }     from './components/task-form-modal/task-form-modal.component';
import { TaskDetailDrawerComponent }  from './components/task-detail-drawer/task-detail-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule, LucideAngularModule,
    AvatarComponent, StatCardComponent, UserSwitcherComponent, FilterPopoverComponent,
    TaskCardComponent, TaskFormModalComponent, TaskDetailDrawerComponent,
  ],
  template: `
    <!-- ============== HEADER ============== -->
    <header class="border-b border-rule bg-cream">
      <div class="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-md flex items-center justify-center" style="background: #1A1A1A;">
            <lucide-icon name="sparkles" [size]="18" style="color: #F4EFE3;"></lucide-icon>
          </div>
          <div>
            <div class="flex items-baseline gap-2">
              <h1 class="font-serif" style="font-size: 28px; line-height: 1; letter-spacing: -0.01em;">Taskwright</h1>
              <span class="text-xs uppercase tracking-widest text-muted">m24</span>
            </div>
            <div class="text-xs mt-0.5 text-muted">Assign work · Track progress · Stay in flow</div>
          </div>
        </div>

        <app-user-switcher *ngIf="me()"
                           [me]="me()!"
                           [staff]="staff()"
                           (selectStaff)="onSelectStaff($event)">
        </app-user-switcher>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <!-- ============== STAT STRIP ============== -->
      <section class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <app-stat-card label="Active"          [value]="stats().active"    accent="#1F3D2F"></app-stat-card>
        <app-stat-card label="Completed"       [value]="stats().completed" accent="#3F3F46"></app-stat-card>
        <app-stat-card label="Overdue"         [value]="stats().overdue"   accent="#991B1B" [pulse]="stats().overdue > 0"></app-stat-card>
        <app-stat-card label="Total assigned"  [value]="stats().total"     accent="#9A3412"></app-stat-card>
      </section>

      <!-- ============== TOOLBAR ============== -->
      <section class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <!-- View tabs -->
        <div class="inline-flex p-1 rounded-lg border border-rule bg-parchment">
          <button type="button"
                  *ngFor="let v of viewTabs"
                  (click)="setView(v.id)"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                  [style.background]="view() === v.id ? '#1A1A1A' : 'transparent'"
                  [style.color]="view() === v.id ? '#F4EFE3' : '#1A1A1A'">
            <lucide-icon [name]="v.icon" [size]="14"></lucide-icon>
            <span>{{ v.label }}</span>
            <span class="text-xs px-1.5 py-0.5 rounded"
                  [style.background]="view() === v.id ? 'rgba(244,239,227,0.18)' : '#F4EFE3'"
                  [style.color]="view() === v.id ? '#F4EFE3' : '#7A6E54'">
              {{ countFor(v.id) }}
            </span>
          </button>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Search -->
          <div class="relative">
            <lucide-icon name="search" [size]="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted"></lucide-icon>
            <input type="text"
                   [ngModel]="search()"
                   (ngModelChange)="search.set($event)"
                   placeholder="Search tasks…"
                   class="pl-9 pr-3 py-2 text-sm rounded-md border w-56 outline-none bg-parchment border-rule">
          </div>

          <app-filter-popover [filter]="filter()" (filterChange)="filter.set($event)"></app-filter-popover>

          <button type="button"
                  (click)="showForm.set(true)"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
                  style="background: #1A1A1A;">
            <lucide-icon name="plus" [size]="15" [strokeWidth]="2.5"></lucide-icon>
            New task
          </button>
        </div>
      </section>

      <!-- ============== TASK GRID ============== -->
      <ng-container *ngIf="visibleTasks().length > 0; else empty">
        <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <app-task-card *ngFor="let task of visibleTasks(); trackBy: trackById"
                         [task]="task"
                         [isMine]="task.assignor.staffId === currentUserId()"
                         (cardClick)="activeTask.set($event)">
          </app-task-card>
        </section>
      </ng-container>

      <ng-template #empty>
        <div class="rounded-lg border-2 border-dashed py-16 text-center border-rule">
          <div class="inline-flex w-12 h-12 items-center justify-center rounded-full mb-4 border bg-parchment border-rule">
            <lucide-icon name="inbox" [size]="20" class="text-muted"></lucide-icon>
          </div>
          <h3 class="font-serif" style="font-size: 26px;">Nothing here yet</h3>
          <p class="text-sm mt-1 max-w-sm mx-auto text-muted">{{ emptyMessage() }}</p>
          <button *ngIf="view() === 'assigned'"
                  type="button"
                  (click)="showForm.set(true)"
                  class="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-md text-sm font-medium text-white"
                  style="background: #1A1A1A;">
            <lucide-icon name="plus" [size]="14"></lucide-icon>
            Create your first task
          </button>
        </div>
      </ng-template>
    </main>

    <!-- ============== MODALS ============== -->
    <app-task-form-modal
      *ngIf="showForm() && me()"
      [currentUser]="me()!"
      [staff]="staff()"
      (close)="showForm.set(false)"
      (created)="onCreate($event)">
    </app-task-form-modal>

    <app-task-detail-drawer
      *ngIf="activeTask()"
      [task]="activeTask()!"
      [currentUserId]="currentUserId()"
      (close)="activeTask.set(null)"
      (statusChange)="onStatusChange($event)"
      (delete)="onDelete()">
    </app-task-detail-drawer>
  `,
})
export class AppComponent implements OnInit {

  private taskApi  = inject(TaskService);
  private staffApi = inject(StaffService);

  /* ---------- state (signals) ---------- */
  staff           = signal<Staff[]>([]);
  tasks           = signal<JobTask[]>([]);
  currentUserId   = signal<string>('');
  view            = signal<ViewMode>('assigned');
  filter          = signal<FilterState>({ status: 'all', type: 'all', priority: 'all' });
  search          = signal<string>('');
  showForm        = signal<boolean>(false);
  activeTask      = signal<JobTask | null>(null);

  readonly viewTabs: { id: ViewMode; label: string; icon: string }[] = [
    { id: 'assigned', label: 'I assigned',     icon: 'send'        },
    { id: 'received', label: 'Assigned to me', icon: 'inbox'       },
    { id: 'all',      label: 'All',            icon: 'trending-up' },
  ];

  /* ---------- derived ---------- */
  me = computed<Staff | null>(() => {
    return this.staff().find(s => s.staffId === this.currentUserId()) ?? null;
  });

  visibleTasks = computed<JobTask[]>(() => {
    const f      = this.filter();
    const q      = this.search().trim().toLowerCase();
    const view   = this.view();
    const userId = this.currentUserId();

    return this.tasks()
      .filter(t => {
        if (view === 'assigned') return t.assignor.staffId === userId;
        if (view === 'received') return t.assignee.staffId === userId;
        return true;
      })
      .filter(t => f.status   === 'all' || t.jobStatus === f.status)
      .filter(t => f.type     === 'all' || t.taskType === f.type)
      .filter(t => f.priority === 'all' || t.priority === f.priority)
      .filter(t => {
        if (!q) return true;
        return t.taskTitle.toLowerCase().includes(q)
            || (t.taskDescription ?? '').toLowerCase().includes(q)
            || t.jobTaskId.toLowerCase().includes(q);
      });
  });

  stats = computed(() => {
    const userId = this.currentUserId();
    const mine   = this.tasks().filter(t => t.assignor.staffId === userId);
    const today  = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      active:    mine.filter(t => t.jobStatus === 'In Progress' || t.jobStatus === 'Pending').length,
      completed: mine.filter(t => t.jobStatus === 'Completed').length,
      overdue:   mine.filter(t => t.jobStatus !== 'Completed' && t.jobStatus !== 'Cancelled'
                              && t.dueDate !== null && new Date(t.dueDate) < today).length,
      total:     mine.length,
    };
  });

  /* ---------- lifecycle ---------- */

  async ngOnInit() {
    await this.loadStaff();
    if (this.staff().length > 0) {
      this.currentUserId.set(this.staff()[0].staffId);
    }
    await this.loadTasks();
  }

  private async loadStaff() {
    try {
      const list = await firstValueFrom(this.staffApi.list());
      this.staff.set(list);
    } catch (e) {
      console.error('Failed to load staff', e);
    }
  }

  private async loadTasks() {
    try {
      // Fetch all so we can filter client-side across all three views without re-fetching.
      const all = await firstValueFrom(this.taskApi.list());
      this.tasks.set(all);
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
  }

  /* ---------- handlers ---------- */

  setView(v: ViewMode) { this.view.set(v); }

  onSelectStaff(s: Staff) {
    this.currentUserId.set(s.staffId);
  }

  countFor(v: ViewMode): number {
    const userId = this.currentUserId();
    if (v === 'assigned') return this.tasks().filter(t => t.assignor.staffId === userId).length;
    if (v === 'received') return this.tasks().filter(t => t.assignee.staffId === userId).length;
    return this.tasks().length;
  }

  emptyMessage(): string {
    switch (this.view()) {
      case 'assigned': return "You haven't assigned any tasks. Create one and dispatch it to a teammate.";
      case 'received': return "No tasks have been assigned to you. Enjoy the calm.";
      default:         return "No tasks match your current filters.";
    }
  }

  async onCreate(req: CreateJobTaskRequest) {
    try {
      const created = await firstValueFrom(this.taskApi.create(req));
      this.tasks.update(list => [created, ...list]);
      this.showForm.set(false);
    } catch (e) {
      console.error('Create failed', e);
      alert('Failed to create task. See console for details.');
    }
  }

  async onStatusChange(status: Status) {
    const task = this.activeTask();
    if (!task) return;
    try {
      const updated = await firstValueFrom(
        this.taskApi.updateStatus(task.uniqId, status, this.currentUserId())
      );
      this.tasks.update(list => list.map(t => t.uniqId === updated.uniqId ? updated : t));
      this.activeTask.set(updated);
    } catch (e) {
      console.error('Status update failed', e);
    }
  }

  async onDelete() {
    const task = this.activeTask();
    if (!task) return;
    try {
      await firstValueFrom(this.taskApi.delete(task.uniqId));
      this.tasks.update(list => list.filter(t => t.uniqId !== task.uniqId));
      this.activeTask.set(null);
    } catch (e) {
      console.error('Delete failed', e);
    }
  }

  trackById(_idx: number, t: JobTask) { return t.uniqId; }
}
