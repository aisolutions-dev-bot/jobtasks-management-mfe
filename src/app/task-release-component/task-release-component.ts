import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';

import { TaskRelease } from '../models/task.model';
import { IAuthService, LoadingState } from '../models/auth';
import { TaskReleaseService } from '../services/task-release.service';

@Component({
  selector: 'app-task-release',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    CardModule, ButtonModule, TableModule, SkeletonModule,
  ],
  templateUrl: './task-release-component.html',
  styleUrls: ['./task-release-component.scss'],
})
export class TaskReleaseComponent implements OnInit {
  private taskReleaseService = inject(TaskReleaseService);

  // RBAC access control
  private readonly MODULE_ID       = 'mod24';
  private readonly ADD_ACCESS_CODE = 'a2402.01'; // control add new button

  releases    = signal<TaskRelease[]>([]);
  canAdd      = signal(false);
  loadingState = signal<LoadingState>(LoadingState.Idle);

  constructor(
    @Inject('AUTH_SERVICE') private authService: IAuthService,
  ) {}

  async ngOnInit() {
    try {
      const accesses = await this.authService.fetchGroupAuthorityAccesses(this.MODULE_ID);
      this.canAdd.set(accesses.some(a => a.accessCode === this.ADD_ACCESS_CODE && a.accessValue));
    } catch (e) {
      console.warn('[TaskRelease] RBAC fetch failed — defaulting to no add access', e);
      this.canAdd.set(false);
    }

    this.loadReleases();
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
