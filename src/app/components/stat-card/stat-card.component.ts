import { CommonModule }       from '@angular/common';
import { Component, Input }   from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-lg border p-4 relative overflow-hidden bg-parchment border-rule">
      <div class="text-xs uppercase tracking-wider mb-2 text-muted">{{ label }}</div>
      <div class="flex items-end gap-2">
        <div class="font-serif leading-none" style="font-size: 44px;" [style.color]="accent">
          {{ value }}
        </div>
        <div *ngIf="pulse"
             class="mb-2 w-2 h-2 rounded-full animate-soft-pulse"
             [style.background]="accent"></div>
      </div>
      <div class="absolute top-0 right-0 w-1 h-full opacity-50" [style.background]="accent"></div>
    </div>
  `,
})
export class StatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number;
  @Input({ required: true }) accent!: string;
  @Input() pulse = false;
}
