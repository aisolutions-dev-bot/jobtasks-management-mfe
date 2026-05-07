import { HttpClient }          from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable }         from 'rxjs';

import { environment } from '../../environments/environment';
import { Staff }       from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private http = inject(HttpClient);
  private readonly base = `${environment.jobTasksBackendUrl}/job-tasks/staff`;

  list(): Observable<Staff[]> {
    return this.http.get<Staff[]>(this.base);
  }
}
