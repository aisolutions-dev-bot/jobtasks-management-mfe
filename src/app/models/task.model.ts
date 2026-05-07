/**
 * Mirrors the JobTaskResponse and StaffSummary records returned by the
 * Quarkus backend. Keep this file in sync with /backend/.../JobTaskDtos.java.
 */

export interface Staff {
  staffId:      number;
  staffName:    string;
  department:   string | null;
  position:     string | null;
  avatarColor:  string | null;
}

export interface JobTask {
  jobTaskId:        number;
  jobTaskCode:      string;
  taskTitle:        string;
  taskType:         TaskType;
  taskDescription:  string | null;
  priority:         Priority;
  status:           Status;
  dueDate:          string | null;       // ISO date (yyyy-MM-dd)
  startedDate:      string | null;       // ISO datetime
  completedDate:    string | null;
  remarks:          string | null;
  createdDate:      string;
  modifiedDate:     string | null;
  assignor:         Staff;
  assignee:         Staff;
}

export type TaskType =
  | 'Software Development' | 'Job Support' | 'System Enquiries'
  | 'Technical Support'    | 'Bug Fix'     | 'Documentation' | 'Other';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Status   = 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

export type ViewMode = 'assigned' | 'received' | 'all';

export interface CreateJobTaskRequest {
  taskTitle:        string;
  taskType:         TaskType;
  taskDescription?: string;
  assignorStaffId:  number;
  assigneeStaffId:  number;
  priority?:        Priority;
  dueDate?:         string | null;
}

export interface UpdateStatusRequest {
  status:     Status;
  modifiedBy: number;
}

export interface FilterState {
  status:   Status | 'all';
  type:     TaskType | 'all';
  priority: Priority | 'all';
}
