import { CommonModule }                                  from '@angular/common';
import { Component, EventEmitter, Input, Output }        from '@angular/core';
import { LucideAngularModule }                           from 'lucide-angular';

import { JobTask }                                              from '../../models/task.model';
import { formatDue, priorityMeta, statusMeta, TONES, typeMeta } from '../../models/constants';
import { AvatarComponent }                                      from '../avatar/avatar.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AvatarComponent],
  template: `
    <article
      (click)="cardClick.emit(task)"
      class="group rounded-lg border cursor-pointer transition-all relative overflow-hidden bg-parchment"
      [style.border-color]="hovered ? '#1A1A1A' : '#E0D8C5'"
      [style.transform]="hovered ? 'translateY(-2px)' : 'translateY(0)'"
      (mouseenter)="hovered = true"
      (mouseleave)="hovered = false">

      <!-- Type ribbon + priority -->
      <div class="px-4 pt-4 flex items-center justify-between">
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
          {{ task.priority }}
        </span>
      </div>

      <!-- Title -->
      <div class="px-4 pt-3">
        <div class="text-xs mb-1 text-muted tabular-nums">{{ task.jobTaskCode }}</div>
        <h3 class="font-serif leading-snug"
            style="font-size: 22px; letter-spacing: -0.005em;"
            [style.color]="isCompleted ? '#7A6E54' : '#1A1A1A'"
            [style.text-decoration]="isCompleted ? 'line-through' : 'none'">
          {{ task.taskTitle }}
        </h3>
      </div>

      <!-- Description -->
      <p class="px-4 pt-2 text-sm line-clamp-2" style="color: #52473A">
        {{ task.taskDescription }}
      </p>

      <!-- Footer -->
      <div class="px-4 mt-4 pt-3 pb-4 border-t flex items-center justify-between gap-2 border-ruleSoft">
        <div class="flex items-center gap-2 min-w-0">
          <ng-container *ngIf="isMine; else fromBlock">
            <span class="text-xs text-muted">To</span>
            <app-avatar [staff]="task.assignee" [size]="22"></app-avatar>
            <span class="text-sm font-medium truncate">{{ task.assignee.staffName }}</span>
          </ng-container>
          <ng-template #fromBlock>
            <span class="text-xs text-muted">From</span>
            <app-avatar [staff]="task.assignor" [size]="22"></app-avatar>
            <span class="text-sm font-medium truncate">{{ task.assignor.staffName }}</span>
          </ng-template>
        </div>

        <div class="text-xs flex items-center gap-1 flex-shrink-0"
             [style.color]="dueColor"
             [style.font-weight]="due?.tone === 'overdue' ? 600 : 500">
          <lucide-icon *ngIf="due?.tone === 'overdue'" name="alert-triangle" [size]="11"></lucide-icon>
          <lucide-icon *ngIf="!due"                    name="calendar"        [size]="11"></lucide-icon>
          {{ due?.label || 'No due date' }}
        </div>
      </div>

      <!-- Status strip -->
      <div class="px-4 pb-3 flex items-center justify-between">
        <div class="inline-flex items-center gap-1.5 text-xs" [style.color]="status.fg">
          <lucide-icon [name]="status.icon" [size]="12"></lucide-icon>
          <span class="font-medium">{{ task.status }}</span>
        </div>
        <button type="button"
                (click)="$event.stopPropagation(); cardClick.emit(task)"
                class="text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-ink">
          Open <lucide-icon name="chevron-right" [size]="12"></lucide-icon>
        </button>
      </div>
    </article>
  `,
})
export class TaskCardComponent {
  @Input({ required: true }) task!: JobTask;
  @Input() isMine = false;

  @Output() cardClick = new EventEmitter<JobTask>();

  hovered = false;

  // Lookups recomputed every change-detection — cheap because the metadata is tiny
  get type()       { return typeMeta(this.task.taskType); }
  get tone()       { return TONES[this.type.tone]; }
  get prio()       { return priorityMeta(this.task.priority); }
  get status()     { return statusMeta(this.task.status); }
  get due()        { return formatDue(this.task.dueDate); }
  get isCompleted(){ return this.task.status === 'Completed'; }

  get dueColor(): string {
    if (!this.due) return '#7A6E54';
    switch (this.due.tone) {
      case 'overdue': return '#991B1B';
      case 'urgent':  return '#9A3412';
      case 'soon':    return '#854D0E';
      default:        return '#7A6E54';
    }
  }
}
