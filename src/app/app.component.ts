import { Component, OnInit, inject, signal, computed, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';

import { JobTask, Staff, Status, TaskType, Priority, CreateJobTaskRequest, TaskAttachment, UpdateProgressRemarksRequest, ReassignRequest, RescheduleRequest } from './models/task.model';
import { IAuthService } from './models/auth';
import { TaskService } from './services/task.service';
import { StaffService } from './services/staff.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, InputTextModule, TagModule, BadgeModule,
    DialogModule, ToastModule, AvatarModule,
    DividerModule, DatePickerModule, TextareaModule, SkeletonModule,
    DrawerModule, TooltipModule, MultiSelectModule,
  ],
  providers: [MessageService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private taskService  = inject(TaskService);
  private staffService = inject(StaffService);
  private msgService   = inject(MessageService);

  // RBAC access control
  private readonly MODULE_ID      = 'mod24';
  private readonly ACCESS_BOARD   = 'a2401';      // can see Task Board tab
  private readonly ACCESS_VIEW_DEPT = 'a2401.01'; // view all dept records
  private readonly ACCESS_VIEW_ALL  = 'a2401.02'; // view all records

  // ── State ──────────────────────────────────────────────────────────────────
  staff        = signal<Staff[]>([]);
  tasks        = signal<JobTask[]>([]);
  me           = signal<Staff | null>(null);
  activeView      = signal<'ALL' | 'ASSIGNED_BY_ME' | 'ASSIGNED_TO_ME'>('ALL');
  searchQuery     = signal('');
  selectedStatuses = signal<Status[]>(['Pending', 'In Progress', 'On Hold', 'Completed', 'Cancelled']);

  readonly statusFilterOptions: { label: string; value: Status }[] = [
    { label: 'Pending',     value: 'Pending'     },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'On Hold',     value: 'On Hold'      },
    { label: 'Completed',   value: 'Completed'   },
    { label: 'Closed',      value: 'Closed'      },
    { label: 'Cancelled',   value: 'Cancelled'   },
  ];
  loading      = signal(false);
  accessDenied = signal(false);   // true when a2401 = 0
  rbacLoading  = signal(true);    // true while checking RBAC

  filteredStaff = computed(() => {
    const q = this.staffSearchQuery().toLowerCase().trim();
    if (!q) return this.staff();
    return this.staff().filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.staffId.toLowerCase().includes(q)
    );
  });

  // Detail dialog
  showDetail   = signal(false);
  selectedTask = signal<JobTask | null>(null);

  // Create wizard
  showWizard   = signal(false);
  wizardStep   = signal(1);
  newTitle     = signal('');
  newType      = signal<TaskType | ''>('');
  newAssignee  = signal<Staff | null>(null);
  newPriority  = signal<Priority>('Medium');
  newDueDate: Date | null = null;
  newDesc      = signal('');

  // Staff search (Step 2)
  staffSearchQuery = signal('');

  statusOptions: { label: string; value: Status }[] = [
    { label: 'Pending',     value: 'Pending'     },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'On Hold',     value: 'On Hold'     },
    { label: 'Completed',   value: 'Completed'   },
    { label: 'Closed',      value: 'Closed'      },
  ];

  // ── Date input dialog (for In Progress / Completed) ────────────────────
  showDateDialog      = signal(false);
  pendingStatus       = signal<Status | null>(null);
  dateDialogNeedStart = signal(false);  // must fill Started Date
  dateDialogNeedEnd   = signal(false);  // must fill Completed Date
  inputStartedDate:   Date | null = null;
  inputCompletedDate: Date | null = null;

  taskTypes: TaskType[] = [
    'Software Development', 'Job Support', 'System Enquiries',
    'Technical Support', 'Bug Fix', 'Documentation',
  ];

  priorities: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

  viewTabs = [
    { label: 'All',            value: 'ALL' },
    { label: 'I assigned',     value: 'ASSIGNED_BY_ME' },
    { label: 'Assigned to me', value: 'ASSIGNED_TO_ME' },
  ];

  private sanitizer = inject(DomSanitizer);

  // ── Wizard attachments (pending, not yet uploaded) ─────────────────────
  pendingFiles   = signal<{ file: File; name: string; size: string }[]>([]);
  isDragOver     = signal(false);
  readonly acceptedTypes = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt,.md';
  readonly maxFileSize   = 20 * 1024 * 1024;

  // ── Detail dialog: loaded attachments ────────────────────────────
  attachments       = signal<TaskAttachment[]>([]);
  attachmentsLoading = signal(false);

  // ── Preview drawer ────────────────────────────────────────────
  previewVisible    = signal(false);
  previewFile       = signal<TaskAttachment | null>(null);
  previewUrl        = signal<string | null>(null);
  safePreviewUrl    = signal<SafeResourceUrl | null>(null);
  previewLoading    = signal(false);
  downloading       = signal(false);

  // ── Edit description (assignor only) ──────────────────────────────
  editingDesc   = signal(false);
  editDescValue = signal('');
  savingDesc    = signal(false);

  // ── Reassign dialog (assignor only) ───────────────────────────────
  showReassignDialog    = signal(false);
  reassignSearchQuery   = signal('');
  selectedNewAssignee   = signal<Staff | null>(null);
  reassigning           = signal(false);

  filteredReassignStaff = computed(() => {
    const q    = this.reassignSearchQuery().toLowerCase().trim();
    const me   = this.me();
    const task = this.selectedTask();
    const list = this.staff().filter(s =>
      s.staffId !== task?.assignee?.staffId
    );
    if (!q) return list;
    return list.filter(s =>
      s.name.toLowerCase().includes(q) || s.staffId.toLowerCase().includes(q)
    );
  });

  // ── Reschedule dialog (assignor only) ─────────────────────────────
  showRescheduleDialog  = signal(false);
  newScheduleDate: Date | null = null;
  rescheduling          = signal(false);

  // ── Progress remarks (assignee only) ──────────────────────────────
  editingProgressRemarks   = signal(false);
  editProgressRemarksValue = signal('');
  savingProgressRemarks    = signal(false);

  // ── Detail screen upload (assignor + assignee) ───────────────────
  detailPendingFiles = signal<{ file: File; name: string; size: string }[]>([]);
  detailIsDragOver   = signal(false);
  uploadingDetail    = signal(false);

  constructor(
    @Inject('AUTH_SERVICE') private authService: IAuthService,
  ) {}

  // ── Computed ───────────────────────────────────────────────────────────────
  filteredTasks = computed(() => {
    let list = this.tasks();
    const q        = this.searchQuery().toLowerCase().trim();
    const me       = this.me();
    const v        = this.activeView();
    const statuses = this.selectedStatuses();

    if (v === 'ASSIGNED_BY_ME' && me)
      list = list.filter(t => t.assignor?.staffId === me.staffId);
    if (v === 'ASSIGNED_TO_ME' && me)
      list = list.filter(t => t.assignee?.staffId === me.staffId);
    if (statuses.length > 0)
      list = list.filter(t => statuses.includes(t.jobStatus as Status));
    if (q) list = list.filter(t =>
      t.taskTitle.toLowerCase().includes(q) ||
      t.jobTaskId?.toLowerCase().includes(q) ||
      (t.taskDescription ?? '').toLowerCase().includes(q));
    return list;
  });

  stats = computed(() => {
    const all  = this.tasks();
    const now  = new Date(); now.setHours(0,0,0,0);
    return {
      active:    all.filter(t => t.jobStatus === 'In Progress' || t.jobStatus === 'Pending').length,
      completed: all.filter(t => t.jobStatus === 'Completed').length,
      overdue:   all.filter(t =>
        t.jobStatus !== 'Completed' && t.jobStatus !== 'Cancelled' &&
        t.dueDate != null && new Date(t.dueDate) < now).length,
      total:     all.length,
    };
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  async ngOnInit() {
    try {
      // Fetch user role + module access
      await this.authService.fetchUserRole();
      await this.authService.fetchGroupAuthorityAccesses(this.MODULE_ID);
    } catch (e) {
      console.warn('[JobTasks] RBAC fetch failed — defaulting to own records only', e);
    }

    // Check a2401 — can the user see the Task Board at all?
    const canSeeBoard = this.authService.hasAccess(this.ACCESS_BOARD);
    if (!canSeeBoard) {
      this.accessDenied.set(true);
      this.rbacLoading.set(false);
      return;
    }

    this.rbacLoading.set(false);
    await this.loadStaff();
    this.loadTasks();
  }

  // ── RBAC helpers ──────────────────────────────────────────────────────────

  /** Returns groupAuthority of logged-in user for backend RBAC call */
  private getGroupAuthority(): string | undefined {
    return this.authService.userRole()?.authorities?.[0] ?? undefined;
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadStaff(): Promise<void> {
    return new Promise(resolve => {
      this.staffService.list().subscribe({
        next: list => {
          this.staff.set(list);
          const loggedInStaffId = this.getLoggedInStaffId();
          const currentUser = loggedInStaffId
            ? list.find(s => s.staffId === loggedInStaffId) ?? list[0]
            : list[0];
          this.me.set(currentUser ?? null);
          resolve();
        },
        error: e => { console.error('loadStaff error', e); resolve(); },
      });
    });
  }

  private loadTasks() {
    this.loading.set(true);
    const staffCode      = this.me()?.staffId;
    const groupAuthority = this.getGroupAuthority();
    this.taskService.list(groupAuthority, staffCode).subscribe({
      next:  list  => { this.tasks.set(list); this.loading.set(false); },
      error: e     => { console.error('loadTasks error', e); this.loading.set(false); },
    });
  }

  /** Read staffId from shell JWT token in localStorage */
  private getLoggedInStaffId(): string | null {
    try {
      // First try from authService (most reliable)
      const staffId = this.authService.userRole()?.staffId;
      if (staffId) return staffId;
      // Fallback: decode JWT from localStorage
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded?.staffId || decoded?.secLoginId || decoded?.sub || null;
    } catch {
      return null;
    }
  }

  // ── Interactions ──────────────────────────────────────────────────────────

  openTask(task: JobTask) {
    this.selectedTask.set(task);
    this.attachments.set([]);
    this.editingDesc.set(false);
    this.editingProgressRemarks.set(false);
    this.showReassignDialog.set(false);
    this.showRescheduleDialog.set(false);
    this.detailPendingFiles.set([]);
    this.showDetail.set(true);
    if (task.jobTaskId) {
      this.loadAttachments(task.jobTaskId);
    }
  }

  private loadAttachments(jobTaskId: string) {
    this.attachmentsLoading.set(true);
    this.taskService.getAttachments(jobTaskId).subscribe({
      next:  list => { this.attachments.set(list); this.attachmentsLoading.set(false); },
      error: e    => { console.error('loadAttachments error', e); this.attachmentsLoading.set(false); },
    });
  }

  // ── Reassign ──────────────────────────────────────────────────────

  openReassignDialog() {
    this.reassignSearchQuery.set('');
    this.selectedNewAssignee.set(null);
    this.showReassignDialog.set(true);
  }

  confirmReassign() {
    const task    = this.selectedTask();
    const newStaff = this.selectedNewAssignee();
    if (!task || !newStaff) return;
    this.reassigning.set(true);
    const req: ReassignRequest = {
      newAssigneeStaffId: newStaff.staffId,
      lastEditStaff:      this.me()?.staffId,
    };
    this.taskService.reassign(task.uniqId, req).subscribe({
      next: updated => {
        this.tasks.update(list => list.map(t => t.uniqId === updated.uniqId ? updated : t));
        this.selectedTask.set(updated);
        this.showReassignDialog.set(false);
        this.reassigning.set(false);
        this.msgService.add({ severity: 'success', summary: 'Task reassigned', life: 2000 });
      },
      error: () => {
        this.reassigning.set(false);
        this.msgService.add({ severity: 'error', summary: 'Failed to reassign task', life: 3000 });
      },
    });
  }

  // ── Reschedule ────────────────────────────────────────────────────

  openRescheduleDialog() {
    const task = this.selectedTask();
    this.newScheduleDate = task?.dueDate ? new Date(task.dueDate) : null;
    this.showRescheduleDialog.set(true);
  }

  setSchedulePreset(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    this.newScheduleDate = d;
  }

  getDaysLabel(date: Date | null): string {
    if (!date) return '';
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const d   = new Date(date); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0)  return 'today';
    if (diff === 1)  return 'tomorrow';
    if (diff === -1) return 'yesterday';
    if (diff > 0)    return `in ${diff} days`;
    return `${Math.abs(diff)} days overdue`;
  }

  isScheduleDatePast(): boolean {
    if (!this.newScheduleDate) return false;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const d   = new Date(this.newScheduleDate); d.setHours(0, 0, 0, 0);
    return d < now;
  }

  confirmReschedule() {
    const task = this.selectedTask();
    if (!task) return;
    this.rescheduling.set(true);
    const req: RescheduleRequest = {
      newDueDate:    this.toLocalDateStr(this.newScheduleDate),
      lastEditStaff: this.me()?.staffId,
    };
    this.taskService.reschedule(task.uniqId, req).subscribe({
      next: updated => {
        this.tasks.update(list => list.map(t => t.uniqId === updated.uniqId ? updated : t));
        this.selectedTask.set(updated);
        this.showRescheduleDialog.set(false);
        this.rescheduling.set(false);
        this.msgService.add({ severity: 'success', summary: 'Task rescheduled', life: 2000 });
      },
      error: () => {
        this.rescheduling.set(false);
        this.msgService.add({ severity: 'error', summary: 'Failed to reschedule task', life: 3000 });
      },
    });
  }

  // ── Wizard file helpers ──────────────────────────────────────────

  onDragOver(e: DragEvent)  { e.preventDefault(); e.stopPropagation(); this.isDragOver.set(true); }
  onDragLeave(e: DragEvent) { e.preventDefault(); e.stopPropagation(); this.isDragOver.set(false); }

  onFileDrop(e: DragEvent) {
    e.preventDefault(); e.stopPropagation();
    this.isDragOver.set(false);
    const files = e.dataTransfer?.files;
    if (files) this.addFiles(Array.from(files));
  }

  triggerFileInput() {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = this.acceptedTypes;
    input.onchange = (ev) => this.onFileSelect(ev);
    input.click();
  }

  private onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) { this.addFiles(Array.from(input.files)); input.value = ''; }
  }

  private addFiles(files: File[]) {
    const current = this.pendingFiles();
    const added: { file: File; name: string; size: string }[] = [];
    for (const f of files) {
      if (f.size > this.maxFileSize) {
        this.msgService.add({ severity: 'warn', summary: 'File too large', detail: `"${f.name}" exceeds 20 MB`, life: 3000 });
        continue;
      }
      if (current.some(p => p.name === f.name)) continue;
      added.push({ file: f, name: f.name, size: this.formatFileSize(f.size) });
    }
    this.pendingFiles.set([...current, ...added]);
  }

  removeFile(index: number, e: Event) {
    e.stopPropagation();
    const list = [...this.pendingFiles()];
    list.splice(index, 1);
    this.pendingFiles.set(list);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileIcon(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf': return 'pi pi-file-pdf';
      case 'doc': case 'docx': return 'pi pi-file-word';
      case 'xls': case 'xlsx': return 'pi pi-file-excel';
      case 'jpg': case 'jpeg': case 'png': return 'pi pi-image';
      default: return 'pi pi-file';
    }
  }

  isPreviewable(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    return ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);
  }

  isPdf(name: string)   { return name.split('.').pop()?.toLowerCase() === 'pdf'; }
  isImage(name: string) { const e = name.split('.').pop()?.toLowerCase() || ''; return ['jpg','jpeg','png'].includes(e); }

  // ── Preview drawer ───────────────────────────────────────────────

  onViewAttachment(attachment: TaskAttachment) {
    this.previewFile.set(attachment);
    this.previewUrl.set(null);
    this.safePreviewUrl.set(null);
    this.previewVisible.set(true);
    if (this.isPreviewable(attachment.originalName)) {
      this.loadPreview(attachment);
    }
  }

  private loadPreview(attachment: TaskAttachment) {
    this.previewLoading.set(true);
    this.taskService.downloadAttachment(attachment.uniqId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        this.previewUrl.set(url);
        this.safePreviewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.previewLoading.set(false);
      },
      error: e => {
        console.error('loadPreview error', e);
        this.previewLoading.set(false);
        this.msgService.add({ severity: 'error', summary: 'Preview failed', detail: String(e), life: 3000 });
      },
    });
  }

  onDownloadAttachment(attachment: TaskAttachment) {
    this.downloading.set(true);
    this.taskService.downloadAttachment(attachment.uniqId).subscribe({
      next: blob => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = attachment.originalName; link.click();
        URL.revokeObjectURL(url);
        this.downloading.set(false);
      },
      error: e => {
        console.error('download error', e);
        this.downloading.set(false);
        this.msgService.add({ severity: 'error', summary: 'Download failed', detail: String(e), life: 3000 });
      },
    });
  }

  onOpenAttachmentInNewTab(attachment: TaskAttachment) {
    this.taskService.downloadAttachment(attachment.uniqId).subscribe({
      next:  blob => { const url = URL.createObjectURL(blob); window.open(url, '_blank'); },
      error: e    => this.msgService.add({ severity: 'error', summary: 'Open failed', detail: String(e), life: 3000 }),
    });
  }

  closePreview() {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewVisible.set(false);
    this.previewFile.set(null);
    this.previewUrl.set(null);
    this.safePreviewUrl.set(null);
    this.previewLoading.set(false);
  }

  getDrawerWidth(): string {
    if (typeof window !== 'undefined') {
      const w = window.innerWidth;
      if (w <= 480) return '100%';
      if (w <= 768) return '35rem';
    }
    return '45rem';
  }

  // ── Role helpers ─────────────────────────────────────────────────────────

  isAssignorOfSelected(): boolean {
    const me = this.me(); const task = this.selectedTask();
    return !!me && !!task && task.assignor?.staffId === me.staffId;
  }

  isAssigneeOfSelected(): boolean {
    const me = this.me(); const task = this.selectedTask();
    return !!me && !!task && task.assignee?.staffId === me.staffId;
  }

  isAssigneeOrAssignorOfSelected(): boolean {
    return this.isAssignorOfSelected() || this.isAssigneeOfSelected();
  }

  /**
   * Per-button enable rule:
   *  Pending     → assignor, any time
   *  On Hold     → assignor only, current must be Pending
   *  In Progress → assignee only, current must be Pending
   *  Completed   → assignee only, current must be In Progress
   *  Closed      → assignor only, current must be Completed
   */
  isStatusAllowed(targetStatus: Status): boolean {
    const task = this.selectedTask(); if (!task) return false;
    const cur  = task.jobStatus as Status;
    const isor = this.isAssignorOfSelected();
    const isee = this.isAssigneeOfSelected();
    switch (targetStatus) {
      case 'Pending':     return isor;
      case 'On Hold':     return isor && cur === 'Pending';
      case 'In Progress': return isee && cur === 'Pending';
      case 'Completed':   return isee && cur === 'In Progress';
      case 'Closed':      return isor && cur === 'Completed';
      default:            return false;
    }
  }

  statusButtonTooltip(targetStatus: Status): string {
    const task = this.selectedTask(); if (!task) return '';
    const cur  = task.jobStatus as Status;
    const isor = this.isAssignorOfSelected();
    const isee = this.isAssigneeOfSelected();
    switch (targetStatus) {
      case 'Pending':     return !isor ? 'Only assignor can reset to Pending' : '';
      case 'On Hold':     return !isor ? 'Only assignor can put On Hold'
                               : cur !== 'Pending' ? 'Must be Pending to put On Hold' : '';
      case 'In Progress': return !isee ? 'Only assignee can start the task'
                               : cur !== 'Pending' ? 'Must be Pending to start' : '';
      case 'Completed':   return !isee ? 'Only assignee can complete'
                               : cur !== 'In Progress' ? 'Must be In Progress to complete' : '';
      case 'Closed':      return !isor ? 'Only assignor can close'
                               : cur !== 'Completed' ? 'Must be Completed to close' : '';
      default: return '';
    }
  }

  /** Called from template when a status button is clicked */
  onStatusButtonClick(targetStatus: Status) {
    if (!this.isStatusAllowed(targetStatus)) return;
    const task = this.selectedTask(); if (!task) return;

    if (targetStatus === 'In Progress') {
      this.pendingStatus.set('In Progress');
      this.dateDialogNeedStart.set(true);
      this.dateDialogNeedEnd.set(false);
      this.inputStartedDate   = task.startedDate ? new Date(task.startedDate as any) : null;
      this.inputCompletedDate = null;
      this.showDateDialog.set(true);
      return;
    }
    if (targetStatus === 'Completed') {
      const needStart = !task.startedDate;
      this.pendingStatus.set('Completed');
      this.dateDialogNeedStart.set(needStart);
      this.dateDialogNeedEnd.set(true);
      this.inputStartedDate   = task.startedDate ? new Date(task.startedDate as any) : null;
      this.inputCompletedDate = null;
      this.showDateDialog.set(true);
      return;
    }
    this.applyStatusChange(targetStatus, null, null);
  }

  onDateDialogConfirm() {
    const status = this.pendingStatus(); if (!status) return;
    if (this.dateDialogNeedStart() && !this.inputStartedDate) {
      this.msgService.add({ severity: 'warn', summary: 'Started Date required', life: 3000 }); return;
    }
    if (this.dateDialogNeedEnd() && !this.inputCompletedDate) {
      this.msgService.add({ severity: 'warn', summary: 'Completed Date required', life: 3000 }); return;
    }
    const toISO = (d: Date | null) => this.toLocalDateStr(d);
    this.showDateDialog.set(false);
    this.applyStatusChange(status, toISO(this.inputStartedDate), toISO(this.inputCompletedDate));
  }

  onDateDialogCancel() {
    this.showDateDialog.set(false);
    this.pendingStatus.set(null);
    this.inputStartedDate = null; this.inputCompletedDate = null;
  }

  private applyStatusChange(status: Status, startedDate: string | null, completedDate: string | null) {
    const task = this.selectedTask(); if (!task) return;
    this.taskService.updateStatus(task.uniqId, status, this.me()?.staffId ?? '', startedDate, completedDate).subscribe({
      next: updated => {
        this.tasks.update(list => list.map(t => t.uniqId === updated.uniqId ? updated : t));
        this.selectedTask.set(updated);
        this.msgService.add({ severity: 'success', summary: 'Status updated', life: 2000 });
      },
      error: () => this.msgService.add({ severity: 'error', summary: 'Failed to update status', life: 3000 }),
    });
  }

  // ── Edit description ──────────────────────────────────────────────

  startEditDesc() {
    const task = this.selectedTask();
    if (!task) return;
    this.editDescValue.set(task.taskDescription ?? '');
    this.editingDesc.set(true);
  }

  cancelEditDesc() {
    this.editingDesc.set(false);
  }

  // ── Progress remarks ──────────────────────────────────────────────

  startEditProgressRemarks() {
    const task = this.selectedTask();
    if (!task) return;
    this.editProgressRemarksValue.set(task.progressRemarks ?? '');
    this.editingProgressRemarks.set(true);
  }

  cancelEditProgressRemarks() {
    this.editingProgressRemarks.set(false);
  }

  saveProgressRemarks() {
    const task = this.selectedTask();
    if (!task) return;
    this.savingProgressRemarks.set(true);
    const req: UpdateProgressRemarksRequest = {
      progressRemarks: this.editProgressRemarksValue() || null,
      lastEditStaff:   this.me()?.staffId,
    };
    this.taskService.updateProgressRemarks(task.uniqId, req).subscribe({
      next: updated => {
        this.tasks.update(list => list.map(t => t.uniqId === updated.uniqId ? updated : t));
        this.selectedTask.set(updated);
        this.editingProgressRemarks.set(false);
        this.savingProgressRemarks.set(false);
        this.msgService.add({ severity: 'success', summary: 'Progress remarks saved', life: 2000 });
      },
      error: () => {
        this.savingProgressRemarks.set(false);
        this.msgService.add({ severity: 'error', summary: 'Failed to save remarks', life: 3000 });
      },
    });
  }

  saveDesc() {
    const task = this.selectedTask();
    if (!task) return;
    this.savingDesc.set(true);
    this.taskService.update(task.uniqId, {
      taskTitle:       task.taskTitle,
      taskType:        task.taskType as any,
      taskDescription: this.editDescValue(),
      assigneeStaffId: task.assignee?.staffId,
      priority:        task.priority as any,
      dueDate:         task.dueDate ? task.dueDate.split('T')[0] : null,
      lastEditStaff:   this.me()?.staffId,
    }).subscribe({
      next: updated => {
        this.tasks.update(list => list.map(t => t.uniqId === updated.uniqId ? updated : t));
        this.selectedTask.set(updated);
        this.editingDesc.set(false);
        this.savingDesc.set(false);
        this.msgService.add({ severity: 'success', summary: 'Description saved', life: 2000 });
      },
      error: () => {
        this.savingDesc.set(false);
        this.msgService.add({ severity: 'error', summary: 'Failed to save description', life: 3000 });
      },
    });
  }

  // ── Detail screen upload ───────────────────────────────────────

  onDetailDragOver(e: DragEvent)  { e.preventDefault(); e.stopPropagation(); this.detailIsDragOver.set(true); }
  onDetailDragLeave(e: DragEvent) { e.preventDefault(); e.stopPropagation(); this.detailIsDragOver.set(false); }

  onDetailFileDrop(e: DragEvent) {
    e.preventDefault(); e.stopPropagation();
    this.detailIsDragOver.set(false);
    const files = e.dataTransfer?.files;
    if (files) this.addDetailFiles(Array.from(files));
  }

  triggerDetailFileInput() {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = this.acceptedTypes;
    input.onchange = (ev) => {
      const i = ev.target as HTMLInputElement;
      if (i.files) { this.addDetailFiles(Array.from(i.files)); i.value = ''; }
    };
    input.click();
  }

  private addDetailFiles(files: File[]) {
    const current = this.detailPendingFiles();
    const added: { file: File; name: string; size: string }[] = [];
    for (const f of files) {
      if (f.size > this.maxFileSize) {
        this.msgService.add({ severity: 'warn', summary: 'File too large', detail: `"${f.name}" exceeds 20 MB`, life: 3000 });
        continue;
      }
      if (current.some(p => p.name === f.name)) continue;
      added.push({ file: f, name: f.name, size: this.formatFileSize(f.size) });
    }
    this.detailPendingFiles.set([...current, ...added]);
  }

  removeDetailFile(index: number, e: Event) {
    e.stopPropagation();
    const list = [...this.detailPendingFiles()];
    list.splice(index, 1);
    this.detailPendingFiles.set(list);
  }

  uploadDetailFiles() {
    const task = this.selectedTask();
    if (!task?.jobTaskId || this.detailPendingFiles().length === 0) return;
    this.uploadingDetail.set(true);
    const uploads = this.detailPendingFiles().map(pf =>
      this.taskService.uploadAttachment(task.jobTaskId!, pf.file, this.me()?.staffId)
    );
    forkJoin(uploads).subscribe({
      next: () => {
        this.detailPendingFiles.set([]);
        this.uploadingDetail.set(false);
        this.loadAttachments(task.jobTaskId!);
        this.msgService.add({ severity: 'success', summary: 'Files uploaded', life: 2000 });
      },
      error: () => {
        this.uploadingDetail.set(false);
        this.msgService.add({ severity: 'error', summary: 'Upload failed', life: 3000 });
      },
    });
  }

  onDeleteTask() {
    const task = this.selectedTask();
    if (!task || !confirm('Delete this task?')) return;
    this.taskService.delete(task.uniqId).subscribe({
      next: () => {
        this.tasks.update(list => list.filter(t => t.uniqId !== task.uniqId));
        this.showDetail.set(false);
        this.msgService.add({ severity: 'success', summary: 'Task deleted', life: 2000 });
      },
    });
  }

  // ── Wizard ────────────────────────────────────────────────────────────────

  openWizard() {
    this.wizardStep.set(1);
    this.newTitle.set(''); this.newType.set(''); this.newAssignee.set(null);
    this.newPriority.set('Medium'); this.newDueDate = null; this.newDesc.set('');
    this.pendingFiles.set([]);
    if (this.staff().length === 0) this.loadStaff();
    this.showWizard.set(true);
  }

  wizardNext() { if (this.wizardStep() < 3) this.wizardStep.update(s => s + 1); }
  wizardBack() { if (this.wizardStep() > 1) this.wizardStep.update(s => s - 1); }

  canNext(): boolean {
    if (this.wizardStep() === 1) return this.newTitle().trim().length > 0 && this.newType() !== '';
    if (this.wizardStep() === 2) return this.newAssignee() !== null;
    return true;
  }

  submitTask() {
    const me       = this.me();
    const assignee = this.newAssignee();
    if (!me || !assignee) return;

    const req: CreateJobTaskRequest = {
      taskTitle:       this.newTitle().trim(),
      taskType:        this.newType() as TaskType,
      taskDescription: this.newDesc(),
      assignorStaffId: me.staffId,
      assigneeStaffId: assignee.staffId,
      priority:        this.newPriority(),
      dueDate:         this.toLocalDateStr(this.newDueDate),
      entryStaff:      me.staffId,
    };

    this.taskService.create(req).subscribe({
      next: created => {
        this.tasks.update(list => [created, ...list]);
        const filesToUpload = this.pendingFiles();
        this.pendingFiles.set([]);

        // Upload any pending attachments now that we have the jobTaskId
        if (filesToUpload.length > 0 && created.jobTaskId) {
          const uploads = filesToUpload.map(pf =>
            this.taskService.uploadAttachment(created.jobTaskId!, pf.file, me.staffId)
          );
          forkJoin(uploads).subscribe({
            next: () => {
              this.showWizard.set(false);
              this.msgService.add({ severity: 'success', summary: 'Task created!', detail: `${filesToUpload.length} file(s) uploaded`, life: 2000 });
            },
            error: () => {
              // Task was saved — only attachment upload failed; close wizard and warn
              this.showWizard.set(false);
              this.msgService.add({ severity: 'warn', summary: 'Task created', detail: 'Some attachments failed to upload', life: 4000 });
            },
          });
        } else {
          // No attachments — close immediately
          this.showWizard.set(false);
          this.msgService.add({ severity: 'success', summary: 'Task created!', life: 2000 });
        }
      },
      error: () => {
        // Task creation failed — keep wizard open so user can retry
        this.msgService.add({ severity: 'error', summary: 'Failed to create task', life: 3000 });
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  prioritySeverity(p: string): 'danger' | 'warn' | 'info' | 'secondary' {
    if (p === 'Urgent') return 'danger';
    if (p === 'High')   return 'warn';
    if (p === 'Medium') return 'info';
    return 'secondary';
  }

  statusSeverity(s: string): 'success' | 'warn' | 'info' | 'secondary' | 'danger' {
    if (s === 'Completed')   return 'success';
    if (s === 'Closed')      return 'success';
    if (s === 'In Progress') return 'warn';
    if (s === 'On Hold')     return 'secondary';
    if (s === 'Cancelled')   return 'danger';
    return 'info';
  }

  isOverdue(task: JobTask): boolean {
    if (!task.dueDate || task.jobStatus === 'Completed' || task.jobStatus === 'Closed' || task.jobStatus === 'Cancelled') return false;
    const now = new Date(); now.setHours(0,0,0,0);
    return new Date(task.dueDate) < now;
  }

  /** Formats a Date using local timezone — avoids UTC shift from toISOString() */
  toLocalDateStr(d: Date | null): string | null {
    if (!d) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  initials(name: string | null | undefined): string {
    if (!name) return '?';
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
