import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { SelectModule } from 'primeng/select';
import { JobTask, Staff, Status } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-task-detail-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    TagModule,
    BadgeModule,
    AvatarModule,
    InputTextareaModule,
    SelectModule,
  ],
  templateUrl: './task-detail-drawer.component.html',
  styleUrls: ['./task-detail-drawer.component.scss'],
})
export class TaskDetailDrawerComponent {
  @Input() task!: JobTask;
  @Input() staff: Staff[] = [];
  @Input() me!: Staff;
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<void>();

  private taskService = inject(TaskService);
  selectedStatus: Status = 'Pending';
  statuses = ['Pending', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

  ngOnInit() {
    this.selectedStatus = this.task.jobStatus as Status;
  }

  onStatusChange(status: Status) {
    this.selectedStatus = status;
    this.taskService.updateStatus(this.task.uniqId, { jobStatus: status }).subscribe({
      next: () => {
        this.statusChanged.emit();
      },
    });
  }

  getTypeSeverity(taskType: string): string {
    const severities: Record<string, string> = {
      'Job Support': 'secondary',
      'Technical Support': 'info',
      'Software Dev': 'success',
      'Documentation': 'secondary',
      'Bug Fix': 'danger',
      'System Enquiries': 'info',
    };
    return severities[taskType] || 'secondary';
  }

  getPrioritySeverity(priority: string): string {
    const severities: Record<string, string> = {
      'High': 'danger',
      'Urgent': 'warning',
      'Medium': 'info',
      'Low': 'secondary',
    };
    return severities[priority] || 'secondary';
  }

  getStatusSeverity(status: string): string {
    const severities: Record<string, string> = {
      'Completed': 'success',
      'In Progress': 'warning',
      'Pending': 'secondary',
      'On Hold': 'info',
      'Cancelled': 'danger',
    };
    return severities[status] || 'secondary';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  onClose() {
    this.close.emit();
  }

  onDelete() {
    if (confirm('Are you sure you want to delete this task?')) {
      this.delete.emit();
    }
  }
}
