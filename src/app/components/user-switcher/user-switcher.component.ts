import { CommonModule }                                       from '@angular/common';
import { Component, EventEmitter, Input, Output, HostListener } from '@angular/core';
import { LucideAngularModule }                                from 'lucide-angular';

import { AvatarComponent } from '../avatar/avatar.component';
import { Staff }           from '../../models/task.model';

@Component({
  selector: 'app-user-switcher',
  standalone: true,
  imports: [CommonModule, AvatarComponent, LucideAngularModule],
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="open = !open; $event.stopPropagation()"
        class="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full border bg-parchment border-rule transition-colors">
        <app-avatar [staff]="me" [size]="32"></app-avatar>
        <div class="text-left">
          <div class="text-sm font-medium leading-tight">{{ me.name }}</div>
          <div class="text-xs leading-tight text-muted">Acting as</div>
        </div>
        <lucide-icon name="chevron-down" [size]="14" class="text-muted"></lucide-icon>
      </button>

      <ng-container *ngIf="open">
        <div class="fixed inset-0 z-30" (click)="open = false"></div>
        <div class="absolute right-0 mt-2 w-72 rounded-lg border shadow-lg z-40 overflow-hidden bg-parchment border-rule">
          <div class="px-4 py-2 text-xs uppercase tracking-wider text-muted bg-cream">
            Switch active staff
          </div>
          <button *ngFor="let s of staff"
                  type="button"
                  (click)="select(s)"
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-stone-100 transition-colors">
            <app-avatar [staff]="s" [size]="28"></app-avatar>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">{{ s.name }}</div>
              <div class="text-xs truncate text-muted">{{ s.appointment }} · {{ s.department }}</div>
            </div>
            <lucide-icon *ngIf="s.staffId === me.staffId" name="check" [size]="14" style="color: #1F3D2F;"></lucide-icon>
          </button>
        </div>
      </ng-container>
    </div>
  `,
})
export class UserSwitcherComponent {
  @Input({ required: true }) me!: Staff;
  @Input({ required: true }) staff: Staff[] = [];
  @Output() selectStaff = new EventEmitter<Staff>();

  open = false;

  @HostListener('document:keydown.escape')
  onEsc() { this.open = false; }

  select(s: Staff) {
    this.selectStaff.emit(s);
    this.open = false;
  }
}
