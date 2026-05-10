/**
 * Mirrors the JobTaskResponse and StaffSummary records returned by the
 * Quarkus backend (com.aisolutions.jobtaskmanagement).
 *
 * Key differences from original scaffold (important — do not revert):
 *  - Staff.staffCode  = Long (m03Staff.Code, the numeric PK)
 *  - Staff.staffId    = string (m03Staff.StaffId, e.g. "T6923")
 *  - Staff.name       = display name  (NOT staffName)
 *  - Staff.appointment= job title     (NOT position)
 *  - JobTask.uniqId   = number (m24JobTasks.UniqID, the PK)
 *  - JobTask.jobTaskId= string code   (e.g. "JT-2026-0001")
 *  - JobTask.jobStatus= status string (NOT status)
 */

export interface Staff {
  staffCode:    number;        // m03Staff.Code — numeric PK
  staffId:      string;        // m03Staff.StaffId — varchar e.g. "T6923"
  name:         string;        // m03Staff.Name
  department:   string | null;
  appointment:  string | null; // m03Staff.Appointment (job title)
  avatarColor:  string | null;
}

/** Used in staff dropdown selects */
export interface StaffDropdownItem {
  staffCode:    number;
  staffId:      string;
  name:         string;
  department:   string | null;
  appointment:  string | null;
  avatarColor:  string | null;
}

export interface JobTask {
  uniqId:           number;        // m24JobTasks.UniqID — the true PK
  jobTaskId:        string;        // m24JobTasks.JobTaskId — display code e.g. "JT-2026-0001"
  taskTitle:        string;
  taskType:         TaskType;
  taskDescription:  string | null;
  priority:         Priority;
  jobStatus:        Status;        // m24JobTasks.JobStatus column (NOT status)
  dueDate:          string | null;
  startedDate:      string | null;
  completedDate:    string | null;
  estimatedHours:   number | null;
  actualHours:      number | null;
  remarks:          string | null;
  attachmentPath:   string | null;
  entryStaff:       string | null;
  entryDate:        string | null;
  lastEditStaff:    string | null;
  lastEdtiDate:     string | null; // preserved typo from DB column name
  assignor:         Staff;
  assignee:         Staff;
}

export type TaskType =
  | 'Software Development' | 'Job Support' | 'System Enquiries'
  | 'Technical Support'    | 'Bug Fix'     | 'Documentation' | 'Other';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Status   = 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Closed' | 'Cancelled';

export type ViewMode = 'assigned' | 'received' | 'all';

export interface CreateJobTaskRequest {
  taskTitle:        string;
  taskType:         TaskType;
  taskDescription?: string;
  assignorStaffId:  string;  // m03Staff.StaffId (varchar)
  assigneeStaffId:  string;  // m03Staff.StaffId (varchar)
  priority?:        Priority;
  dueDate?:         string | null;
  entryStaff?:      string;
}

export interface UpdateJobTaskRequest {
  taskTitle?:        string;
  taskType?:         TaskType;
  taskDescription?:  string | null;
  assigneeStaffId?:  string;
  priority?:         Priority;
  dueDate?:          string | null;
  lastEditStaff?:    string;
}

export interface UpdateStatusRequest {
  jobStatus:      Status;
  lastEditStaff?: string;
  startedDate?:   string | null;   // ISO date YYYY-MM-DD, user-supplied
  completedDate?: string | null;   // ISO date YYYY-MM-DD, user-supplied
}

// ─── Attachment ────────────────────────────────────────────────────────────

export interface TaskAttachment {
  uniqId:        number;
  moduleType:    string;
  referenceCode: string;
  fileName:      string;
  originalName:  string;
  fileSize:      number;
  storageType:   string;
  contentType:   string;
  fileExtension: string;
  filePath:      string;
  description?:  string;
  uploadSource:  string;
  entryStaff?:   string;
  entryDate?:    string;
}

export interface FilterState {
  viewMode: 'ALL' | 'ASSIGNED_BY_ME' | 'ASSIGNED_TO_ME';
  status:   Status | 'all';
  type:     TaskType | 'all';
  priority: Priority | 'all';
}
