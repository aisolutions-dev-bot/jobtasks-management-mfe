import { Signal } from '@angular/core';

export interface UserRole {
  staffId: string;
  authorities: string[];
}

export interface GroupAuthorityAccess {
  uniqId: number;
  groupAuthority: string;
  moduleId: string;
  accessCode: string;
  accessName: string;
  accessValue: boolean;
  entryStaff: string | null;
  entryDate: string | null;
  lastEditStaff: string | null;
  lastEditDate: string | null;
}

export enum LoadingState {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}

export interface IAuthService {
  /**
   * The current user role signal (null if not loaded)
   */
  userRole: Signal<UserRole | null>;

  /**
   * The loading state of fetching user role
   */
  loadingStateUserRole: Signal<LoadingState>;

  /**
   * The current group authority accesses (empty array if not loaded)
   */
  groupAuthorityAccesses: Signal<GroupAuthorityAccess[]>;

  /**
   * Fetches the user role from the backend
   * Returns the UserRole object
   */
  fetchUserRole(): Promise<UserRole>;

  /**
   * Fetches group authority accesses for a specific module
   * @param moduleId - the module ID (e.g., 'mod17')
   * Returns the list of accesses
   */
  fetchGroupAuthorityAccesses(moduleId: string): Promise<GroupAuthorityAccess[]>;

  /**
   * Checks if user has specific access code granted
   * @param accessCode - the access code to check (e.g., 'a1701')
   * Returns true if access is granted
   */
  hasAccess(accessCode: string): boolean;
}
