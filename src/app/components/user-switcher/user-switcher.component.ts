import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { AvatarModule } from 'primeng/avatar';
import { Staff } from '../../models/task.model';

@Component({
  selector: 'app-user-switcher',
  standalone: true,
  imports: [CommonModule, ButtonModule, DropdownModule, AvatarModule],
  template: `
    <div class="user-switcher">
      <p-dropdown
        [options]="staff"
        [(ngModel)]="selectedStaff"
        optionLabel="name"
        (onChange)="onSelectStaff($event.value)"
        [showClear]="false"
        styleClass="w-full"
      >
        <ng-template pTemplate="selectedItem">
          <div class="flex items-center gap-2">
            <p-avatar
              [label]="initials"
              shape="circle"
              size="small"
              [style]="{ 'background-color': selectedStaff?.avatarColor || '#6b7280', color: '#fff' }"
            />
            <span>{{ selectedStaff?.name }}</span>
          </div>
        </ng-template>

        <ng-template pTemplate="item" let-option>
          <div class="flex items-center gap-2">
            <p-avatar
              [label]="getInitials(option.name)"
              shape="circle"
              size="small"
              [style]="{ 'background-color': option.avatarColor, color: '#fff' }"
            />
            <div>
              <div class="font-medium">{{ option.name }}</div>
              <div class="text-xs text-gray-500">{{ option.appointment }}</div>
            </div>
          </div>
        </ng-template>
      </p-dropdown>
    </div>
  `,
  styles: [`
    .user-switcher {
      min-width: 200px;
    }

    :deep {
      .p-dropdown {
        width: 100%;
      }
    }
  `],
})
export class UserSwitcherComponent {
  @Input() me!: Staff;
  @Input() staff: Staff[] = [];
  @Output() selectStaff = new EventEmitter<Staff>();

  selectedStaff: Staff | null = null;

  ngOnInit() {
    this.selectedStaff = this.me;
  }

  onSelectStaff(staff: Staff) {
    this.selectedStaff = staff;
    this.selectStaff.emit(staff);
  }

  get initials(): string {
    return this.me.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
