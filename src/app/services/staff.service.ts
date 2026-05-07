import { HttpClient }          from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable }         from 'rxjs';

import { Staff } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private http = inject(HttpClient);
  private readonly base = 'http://localhost:8080/api/staff';

  list(): Observable<Staff[]> {
    return this.http.get<Staff[]>(this.base);
  }
}
