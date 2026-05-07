import { CommonModule }                                       from '@angular/common';
import { Component, EventEmitter, Input, Output }             from '@angular/core';
import { LucideAngularModule }                                from 'lucide-angular';

import { JobTask, Status }                                    from '../../models/task.model';
import { formatDue, priorityMeta, STATUSES, TONES, typeMeta } from '../../models/constants';
import { AvatarComponent }                                    from '../avatar/avatar.component';

@Component({
  selector: 'app-task-detail-drawer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AvatarComponent],
  template: `
    <div class="fixed inset-0 z-50 flex justify-end"
         style="background: rgba(26,26,26,0.45); backdrop-filter: blur(4px);"
         (click)="close.emit()">

      <div class="w-full max-w-xl h-full overflow-y-auto border-l bg-parchment border-rule"
           (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="px-6 pt-6 pb-4 flex items-start justify-between gap-4 border-b sticky top-0 z-10 bg-parchment border-ruleSoft">
          <div class="flex-1 min-w-0">
            <div class="text-xs mb-2 text-muted tabular-nums">{{ task.jobTaskId }}</div>
            <h2 class="font-serif" style="font-size: 30px; line-height: 1.1;">{{ task.taskTitle }}</h2>

            <div class="flex items-center gap-2 mt-3 flex-wrap">
              <span class="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium"
                    [style.background]="tone.bg"
                    [style.color]="tone.fg"
                    [style.border]="'1px solid ' + tone.border">
                <lucide-icon [name]="type.icon" [size]="11"></lucide-icon>
                {{ type.label }}
              </span>
              <span class="text-xs px-2 py-0.5 rounded font-medium"
                    [style.background]="prio.bg"
                    [style.color]="prio.fg">
                {{ task.priority }} priority
              </span>
            </div>
          </div>
          <button type="button" (click)="close.emit()" class="p-1.5 rounded-md hover:bg-stone-100">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-6 space-y-6">

          <!-- Status pills (selectable) -->
          <div>
            <div class="text-xs uppercase tracking-wider mb-2 text-muted">Status</div>
            <div class="grid grid-cols-2 gap-1.5">
              <button *ngFor="let s of statuses"
                      type="button"
                      (click)="statusChange.emit(s.id)"
                      class="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-all"
                      [style.border-color]="task.jobStatus === s.id ? s.fg : '#E0D8C5'"
                      [style.background]="task.jobStatus === s.id ? '#F4EFE3' : '#FFFDF8'"
                      [style.color]="task.jobStatus === s.id ? s.fg : '#1A1A1A'">
                <lucide-icon [name]="s.icon" [size]="14"></lucide-icon>
                {{ s.id }}
              </button>
            </div>
          </div>

          <!-- Parties -->
          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-md p-3 border border-ruleSoft" style="background: #F9F4E7;">
              <div class="text-xs uppercase tracking-wider mb-2 text-muted">Assignor</div>
              <div class="flex items-center gap-2">
                <app-avatar [staff]="task.assignor" [size]="32"></app-avatar>
                <div class="min-w-0">
                  <div class="text-sm font-medium truncate">{{ task.assignor.name }}</div>
                  <div class="text-xs truncate text-muted">{{ task.assignor.appointment }}</div>
                </div>
              </div>
            </div>
            <div class="rounded-md p-3 border border-ruleSoft" style="background: #F9F4E7;">
              <div class="text-xs uppercase tracking-wider mb-2 text-muted">Assignee</div>
              <div class="flex items-center gap-2">
                <app-avatar [staff]="task.assignee" [size]="32"></app-avatar>
                <div class="min-w-0">
                  <div class="text-sm font-medium truncate">{{ task.assignee.name }}</div>
                  <div class="text-xs truncate text-muted">{{ task.assignee.appointment }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Meta -->
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-xs uppercase tracking-wider mb-1 text-muted">Due</div>
              <div class="text-sm font-medium">{{ due?.label || '—' }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wider mb-1 text-muted">Created</div>
              <div class="text-sm font-medium">{{ createdLabel }}</div>
            </div>
          </div>

          <!-- Description -->
          <div>
            <div class="text-xs uppercase tracking-wider mb-2 text-muted">Description</div>
            <div class="rounded-md p-4 text-sm leading-relaxed whitespace-pre-wrap border border-ruleSoft"
                 style="background: #F9F4E7; color: #3A3328;">
              {{ task.taskDescription || 'No description provided.' }}
            </div>
          </div>

          <!-- Danger zone -->
          <div *ngIf="isAssignor" class="pt-4 border-t border-ruleSoft">
            <button type="button"
                    (click)="confirmDelete()"
                    class="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-md border transition-colors"
                    style="border-color: #F0B5B5; color: #991B1B; background: transparent;"
                    onmouseover="this.style.background='#FBDDDD'"
                    onmouseout="this.style.background='transparent'">
              <lucide-icon name="trash-2" [size]="14"></lucide-icon>
              Delete task
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TaskDetailDrawerComponent {
  @Input({ required: true }) task!: JobTask;
  @Input({ required: true }) currentUserId!: string;

  @Output() close        = new EventEmitter<void>();
  @Output() statusChange = new EventEmitter<Status>();
  @Output() delete       = new EventEmitter<void>();

  readonly statuses = STATUSES;

  get type()       { return typeMeta(this.task.taskType); }
  get tone()       { return TONES[this.type.tone]; }
  get prio()       { return priorityMeta(this.task.priority); }
  get due()        { return formatDue(this.task.dueDate); }
  get isAssignor() { return this.task.assignor.staffId === this.currentUserId; }
  get createdLabel(): string {
    if (!this.task.entryDate) return '—';
    return new Date(this.task.entryDate)
      .toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  confirmDelete() {
    if (confirm('Delete this task?')) this.delete.emit();
  }
}
