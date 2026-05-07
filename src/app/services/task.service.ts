import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject }    from '@angular/core';
import { Observable }            from 'rxjs';

import { environment }                                                         from '../../environments/environment';
import { CreateJobTaskRequest, JobTask, Status, StaffDropdownItem, UpdateStatusRequest } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);

  private readonly base = `${environment.jobTasksBackendUrl}/job-tasks`;

  /**
   * List job tasks with optional RBAC filtering.
   *
   * @param groupAuthority - The user's group authority string (e.g. "GRPADMIN")
   * @param staffCode      - The user's StaffId varchar from m03Staff (e.g. "S001")
   */
  list(groupAuthority?: string, staffCode?: string): Observable<JobTask[]> {
    let params = new HttpParams();
    if (groupAuthority) params = params.set('groupAuthority', groupAuthority);
    if (staffCode)      params = params.set('staffCode', staffCode);
    return this.http.get<JobTask[]>(this.base, { params });
  }

  get(id: number): Observable<JobTask> {
    return this.http.get<JobTask>(`${this.base}/${id}`);
  }

  create(req: CreateJobTaskRequest): Observable<JobTask> {
    return this.http.post<JobTask>(this.base, req);
  }

  update(id: number, req: Partial<CreateJobTaskRequest>): Observable<JobTask> {
    return this.http.put<JobTask>(`${this.base}/${id}`, req);
  }

  updateStatus(id: number, jobStatus: Status, lastEditStaff?: string): Observable<JobTask> {
    const body: UpdateStatusRequest = { jobStatus, lastEditStaff };
    return this.http.patch<JobTask>(`${this.base}/${id}/status`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /** Staff dropdown for assignor/assignee selects. */
  staff(): Observable<StaffDropdownItem[]> {
    return this.http.get<StaffDropdownItem[]>(`${this.base}/staff`);
  }
}
