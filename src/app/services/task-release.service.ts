import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject }     from '@angular/core';
import { Observable }             from 'rxjs';

import { environment } from '../../environments/environment';
import {
  CreateTaskReleaseRequest,
  JobTask,
  Status,
  TaskRelease,
} from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskReleaseService {
  private http = inject(HttpClient);

  private readonly base = `${environment.jobTasksBackendUrl}/task-releases`;

  list(): Observable<TaskRelease[]> {
    return this.http.get<TaskRelease[]>(this.base);
  }

  create(req: CreateTaskReleaseRequest): Observable<TaskRelease> {
    return this.http.post<TaskRelease>(this.base, req);
  }

  /**
   * Job tasks eligible to be bundled into a release: matches one of the
   * given statuses AND not already linked to another release (server-side
   * filter — releaseId IS NULL).
   */
  getReleasableJobTasks(statuses: Status[], search: string): Observable<JobTask[]> {
    const params = new HttpParams()
      .set('statuses', statuses.join(','))
      .set('search', search ?? '');
    return this.http.get<JobTask[]>(`${this.base}/releasable-job-tasks`, { params });
  }
}
