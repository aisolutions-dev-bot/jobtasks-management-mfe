import { CommonModule }       from '@angular/common';
import { Component, Input }  from '@angular/core';

import { Staff }    from '../../models/task.model';
import { initials } from '../../models/constants';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.font-size.px]="size * 0.4"
      [style.background]="bg"
      [title]="staff.name">
      {{ label }}
    </div>
  `,
})
export class AvatarComponent {
  @Input({ required: true }) staff!: Staff;
  @Input() size = 32;

  get bg():    string { return this.staff.avatarColor ?? '#3F3F46'; }
  get label(): string { return initials(this.staff.name); }
}
