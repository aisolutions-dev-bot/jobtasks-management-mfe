import { HttpClient }      from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable }      from 'rxjs';

import { environment } from '../../../../environments/environment';

export interface SystemVersion {
  versionNumber: string;
  patchNumber:   string;
}

@Injectable({ providedIn: 'root' })
export class SystemVersionService {
  private http = inject(HttpClient);

  getCurrentVersion(): Observable<SystemVersion> {
    return this.http.get<SystemVersion>(`${environment.organizationApiUrl}/system-parameters/version`);
  }
}
