import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject }    from '@angular/core';
import { Observable }            from 'rxjs';

import { environment }           from '../../environments/environment';
import {
  CreateJobTaskRequest,
  JobTask,
  Status,
  StaffDropdownItem,
  TaskAttachment,
  UpdateStatusRequest,
} from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);

  private readonly base = `${environment.jobTasksBackendUrl}/job-tasks`;

  /**
   * List job tasks with optional RBAC filtering.
   *
   * @param groupAuthority - The user's group authority string (e.g. "GRPADMIN")
   * @param staffCode      - The user's StaffId varchar from m03Staff (e.g. "T6923")
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

  /**
   * Update task status.
   * @param id          - m24JobTasks.UniqID (the numeric PK)
   * @param jobStatus   - new Status value
   * @param lastEditStaff - the current user's StaffId string
   */
  updateStatus(
    id: number,
    jobStatus: Status,
    lastEditStaff?: string,
    startedDate?: string | null,
    completedDate?: string | null,
  ): Observable<JobTask> {
    const body: UpdateStatusRequest = { jobStatus, lastEditStaff, startedDate, completedDate };
    return this.http.patch<JobTask>(`${this.base}/${id}/status`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /** Staff dropdown for assignor/assignee selects. */
  staff(): Observable<StaffDropdownItem[]> {
    return this.http.get<StaffDropdownItem[]>(`${this.base}/staff`);
  }

  // ─── Attachments ────────────────────────────────────────────────────

  private readonly attachBase = `${environment.jobTasksBackendUrl}/attachments`;

  /** List attachment metadata for a task */
  getAttachments(jobTaskId: string): Observable<TaskAttachment[]> {
    return this.http.get<TaskAttachment[]>(`${this.attachBase}?jobTaskId=${jobTaskId}`);
  }

  /** Upload a single file (multipart) */
  uploadAttachment(jobTaskId: string, file: File, entryStaff?: string): Observable<TaskAttachment> {
    const fd = new FormData();
    fd.append('file',       file);
    fd.append('jobTaskId',  jobTaskId);
    if (entryStaff) fd.append('entryStaff', entryStaff);
    return this.http.post<TaskAttachment>(`${this.attachBase}/upload`, fd);
  }

  /** Download attachment as Blob (for inline preview or force-download) */
  downloadAttachment(attachmentId: number): Observable<Blob> {
    return this.http.get(`${this.attachBase}/download/${attachmentId}`, { responseType: 'blob' });
  }

  /** Delete an attachment */
  deleteAttachment(attachmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.attachBase}/${attachmentId}`);
  }
}
