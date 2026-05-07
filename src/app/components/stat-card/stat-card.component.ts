import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-lg p-6 flex flex-col gap-2" [style.backgroundColor]="bgColor">
      <span class="text-xs uppercase tracking-widest font-medium" [style.color]="labelColor">
        {{ label }}
      </span>
      <div class="font-serif text-5xl font-light leading-none">{{ value }}</div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    div {
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }
    }

    .font-serif {
      font-family: 'Instrument Serif', serif;
    }
  `],
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: number = 0;
  @Input() labelColor: string = '#1A1A1A';
  @Input() bgColor: string = '#ECE6DD';
}
