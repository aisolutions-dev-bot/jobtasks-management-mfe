import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule, AvatarModule],
  template: `
    <p-avatar
      [label]="initials"
      shape="circle"
      size="large"
      [style]="{ 'background-color': avatarColor, color: '#fff' }"
    />
  `,
})
export class AvatarComponent {
  @Input() name: string = '';
  @Input() avatarColor: string = '#6b7280';

  get initials(): string {
    return this.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
