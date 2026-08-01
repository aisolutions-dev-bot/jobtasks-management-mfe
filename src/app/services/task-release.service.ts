import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject }     from '@angular/core';
import { Observable }             from 'rxjs';

import { environment } from '../../environments/environment';
import {
  CreateTaskReleaseRequest,
  JobTask,
  Status,
  TaskRelease,
  TaskReleaseDetail,
  UpdateTaskReleaseRequest,
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

  /** Preview only — the authoritative Release ID is assigned server-side at creation time. */
  getNextReleaseId(): Observable<{ releaseId: string }> {
    return this.http.get<{ releaseId: string }>(`${this.base}/next-release-id`);
  }

  getDetail(id: number): Observable<TaskReleaseDetail> {
    return this.http.get<TaskReleaseDetail>(`${this.base}/${id}`);
  }

  update(id: number, req: UpdateTaskReleaseRequest): Observable<TaskRelease> {
    return this.http.put<TaskRelease>(`${this.base}/${id}`, req);
  }

  addJobTasks(id: number, jobTaskIds: number[]): Observable<TaskReleaseDetail> {
    return this.http.post<TaskReleaseDetail>(`${this.base}/${id}/tasks`, { jobTaskIds });
  }

  removeJobTask(id: number, jobTaskUniqId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/tasks/${jobTaskUniqId}`);
  }

  deleteRelease(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
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
