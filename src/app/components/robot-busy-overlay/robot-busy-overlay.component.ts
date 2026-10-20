import { Component, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';
import { ROBOT_IMAGE_DATA_URI } from './robot-image';

export type RobotBusyMode = 'loading' | 'saving';

/**
 * Full-screen "system is busy" overlay with the AI Solutions robot.
 *
 *  loading → robot floats with a gentle glance, plus bouncing dots
 *  saving  → robot breathes with a pulsing antenna and an orbiting ring
 *
 * The backdrop swallows clicks so the user cannot fire a second save while one
 * is in flight. The host element is moved to <body> so `position: fixed` covers
 * the whole viewport even when the shell wraps this MFE in a transformed
 * container, and it stacks above PrimeNG dialogs.
 */
@Component({
  selector: 'robot-busy-overlay',
  standalone: true,
  templateUrl: './robot-busy-overlay.component.html',
  styleUrl: './robot-busy-overlay.component.scss',
})
export class RobotBusyOverlayComponent implements OnInit, OnDestroy {
  mode    = input<RobotBusyMode>('loading');
  message = input<string>('');

  readonly robotSrc = ROBOT_IMAGE_DATA_URI;

  private host = inject(ElementRef<HTMLElement>);

  ngOnInit() {
    document.body.appendChild(this.host.nativeElement);
  }

  ngOnDestroy() {
    this.host.nativeElement.remove();
  }
}
