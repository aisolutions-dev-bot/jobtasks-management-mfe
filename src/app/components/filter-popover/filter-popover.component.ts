import { CommonModule }                              from '@angular/common';
import { Component, EventEmitter, Input, Output }    from '@angular/core';
import { LucideAngularModule }                       from 'lucide-angular';

import { FilterState, Priority, Status, TaskType } from '../../models/task.model';
import { PRIORITIES, STATUSES, TASK_TYPES }         from '../../models/constants';

@Component({
  selector: 'app-filter-popover',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="relative">
      <button type="button"
              (click)="open = !open; $event.stopPropagation()"
              class="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border bg-parchment border-rule transition-colors">
        <lucide-icon name="sliders-horizontal" [size]="14"></lucide-icon>
        Filters
        <span *ngIf="activeCount > 0"
              class="text-xs rounded-full px-1.5 py-0.5 text-white"
              style="background: #9A3412">{{ activeCount }}</span>
      </button>

      <ng-container *ngIf="open">
        <div class="fixed inset-0 z-30" (click)="open = false"></div>
        <div class="absolute right-0 mt-2 w-72 rounded-lg border shadow-lg p-4 z-40 bg-parchment border-rule">

          <!-- Status -->
          <div class="mb-3">
            <div class="text-xs uppercase tracking-wider mb-1.5 text-muted">Status</div>
            <div class="flex flex-wrap gap-1">
              <button *ngFor="let opt of statusOptions"
                      type="button"
                      (click)="setStatus(opt)"
                      class="text-xs px-2 py-1 rounded-md border transition-all"
                      [style.border-color]="filter.status === opt ? '#1A1A1A' : '#E0D8C5'"
                      [style.background]="filter.status === opt ? '#1A1A1A' : 'transparent'"
                      [style.color]="filter.status === opt ? '#F4EFE3' : '#1A1A1A'">
                {{ opt === 'all' ? 'All' : opt }}
              </button>
            </div>
          </div>

          <!-- Type -->
          <div class="mb-3">
            <div class="text-xs uppercase tracking-wider mb-1.5 text-muted">Task Type</div>
            <div class="flex flex-wrap gap-1">
              <button *ngFor="let opt of typeOptions"
                      type="button"
                      (click)="setType(opt)"
                      class="text-xs px-2 py-1 rounded-md border transition-all"
                      [style.border-color]="filter.type === opt ? '#1A1A1A' : '#E0D8C5'"
                      [style.background]="filter.type === opt ? '#1A1A1A' : 'transparent'"
                      [style.color]="filter.type === opt ? '#F4EFE3' : '#1A1A1A'">
                {{ opt === 'all' ? 'All' : opt }}
              </button>
            </div>
          </div>

          <!-- Priority -->
          <div class="mb-1">
            <div class="text-xs uppercase tracking-wider mb-1.5 text-muted">Priority</div>
            <div class="flex flex-wrap gap-1">
              <button *ngFor="let opt of priorityOptions"
                      type="button"
                      (click)="setPriority(opt)"
                      class="text-xs px-2 py-1 rounded-md border transition-all"
                      [style.border-color]="filter.priority === opt ? '#1A1A1A' : '#E0D8C5'"
                      [style.background]="filter.priority === opt ? '#1A1A1A' : 'transparent'"
                      [style.color]="filter.priority === opt ? '#F4EFE3' : '#1A1A1A'">
                {{ opt === 'all' ? 'All' : opt }}
              </button>
            </div>
          </div>

          <button *ngIf="activeCount > 0"
                  type="button"
                  (click)="clearAll()"
                  class="text-xs mt-2 underline text-muted">
            Clear all filters
          </button>
        </div>
      </ng-container>
    </div>
  `,
})
export class FilterPopoverComponent {
  @Input({ required: true }) filter!: FilterState;
  @Output() filterChange = new EventEmitter<FilterState>();

  open = false;

  statusOptions:   (Status   | 'all')[] = ['all', ...STATUSES.map(s => s.id)];
  typeOptions:     (TaskType | 'all')[] = ['all', ...TASK_TYPES.map(t => t.id)];
  priorityOptions: (Priority | 'all')[] = ['all', ...PRIORITIES.map(p => p.id)];

  get activeCount(): number {
    return ['status', 'type', 'priority']
      .filter((k) => (this.filter as any)[k] !== 'all').length;
  }

  setStatus  (v: Status | 'all')   { this.filterChange.emit({ ...this.filter, status:   v }); }
  setType    (v: TaskType | 'all') { this.filterChange.emit({ ...this.filter, type:     v }); }
  setPriority(v: Priority | 'all') { this.filterChange.emit({ ...this.filter, priority: v }); }

  clearAll() {
    this.filterChange.emit({ status: 'all', type: 'all', priority: 'all' });
  }
}
