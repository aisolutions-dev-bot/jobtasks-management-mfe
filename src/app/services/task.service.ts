import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject }    from '@angular/core';
import { Observable }            from 'rxjs';

import { CreateJobTaskRequest, JobTask, Status, UpdateStatusRequest, ViewMode } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);

  /** Override this in environment.ts in a real app. */
  private readonly base = 'http://localhost:8080/api/job-tasks';

  list(view: ViewMode, staffId: number): Observable<JobTask[]> {
    let params = new HttpParams().set('view', view);
    if (view !== 'all') params = params.set('staffId', staffId);
    return this.http.get<JobTask[]>(this.base, { params });
  }

  get(id: number): Observable<JobTask> {
    return this.http.get<JobTask>(`${this.base}/${id}`);
  }

  create(req: CreateJobTaskRequest): Observable<JobTask> {
    return this.http.post<JobTask>(this.base, req);
  }

  updateStatus(id: number, status: Status, modifiedBy: number): Observable<JobTask> {
    const body: UpdateStatusRequest = { status, modifiedBy };
    return this.http.patch<JobTask>(`${this.base}/${id}/status`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
