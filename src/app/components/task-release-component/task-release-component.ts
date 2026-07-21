import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { TaskRelease } from '../../models/task.model';
import { IAuthService, LoadingState } from '../../models/auth';
import { TaskReleaseService } from '../../services/task-release.service';

@Component({
  selector: 'app-task-release',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    CardModule, ButtonModule, TableModule, ProgressSpinnerModule,
  ],
  templateUrl: './task-release-component.html',
  styleUrls: ['./task-release-component.scss'],
})
export class TaskReleaseComponent implements OnInit {
  private taskReleaseService = inject(TaskReleaseService);
  private router = inject(Router);

  // RBAC access control
  private readonly MODULE_ID       = 'mod24';
  private readonly ADD_ACCESS_CODE = 'a2402.01'; // control add new button

  releases    = signal<TaskRelease[]>([]);
  canAdd      = signal(false);
  loadingState = signal<LoadingState>(LoadingState.Loading);

  constructor(
    @Inject('AUTH_SERVICE') private authService: IAuthService,
  ) {}

  async ngOnInit() {
    // Fire the releases fetch immediately so the spinner is the only state
    // visible before data arrives — don't wait on the RBAC lookup first.
    this.loadReleases();

    try {
      const accesses = await this.authService.fetchGroupAuthorityAccesses(this.MODULE_ID);
      this.canAdd.set(accesses.some(a => a.accessCode === this.ADD_ACCESS_CODE && a.accessValue));
    } catch (e) {
      console.warn('[TaskRelease] RBAC fetch failed — defaulting to no add access', e);
      this.canAdd.set(false);
    }
  }

  goToView(uniqId: number) {
    this.router.navigate(['/job-tasks/release/view', uniqId]);
  }

  private loadReleases() {
    this.loadingState.set(LoadingState.Loading);
    this.taskReleaseService.list().subscribe({
      next: list => {
        this.releases.set(list);
        this.loadingState.set(LoadingState.Success);
      },
      error: e => {
        console.error('[TaskRelease] loadReleases error', e);
        this.loadingState.set(LoadingState.Error);
      },
    });
  }
}
