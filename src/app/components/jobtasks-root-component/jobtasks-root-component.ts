import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JobTasksTabsRouter } from '../jobtasks-tabs-router/jobtasks-tabs-router';

@Component({
  selector: 'jobtasks-root',
  standalone: true,
  imports: [RouterOutlet, JobTasksTabsRouter],
  templateUrl: './jobtasks-root-component.html',
  styleUrl: './jobtasks-root-component.scss',
})
export class JobTasksRootComponent {
  protected readonly title = signal('jobtasks-management-mfe');
}
