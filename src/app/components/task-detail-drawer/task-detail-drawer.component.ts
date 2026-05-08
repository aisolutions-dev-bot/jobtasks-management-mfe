import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { JobTask, Staff, Status } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { inject } from '@angular/core';

@Component({
  selector: 'app-task-detail-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AvatarComponent],
  templateUrl: './task-detail-drawer.component.html',
  styleUrls: ['./task-detail-drawer.component.scss'],
})
export class TaskDetailDrawerComponent {
  @Input() task!: JobTask;
  @Input() staff!: Staff[];
  @Input() me!: Staff;
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
  @Output() statusChanged = new EventEmitter<void>();

  private taskService = inject(TaskService);
  selectedStatus: Status = 'Pending';

  ngOnInit() {
    this.selectedStatus = this.task.jobStatus as Status;
  }

  onStatusChange(status: Status) {
    this.selectedStatus = status;
    this.taskService.updateStatus(this.task.uniqId, status, String(this.me.staffCode)).subscribe({
      next: () => {
        this.statusChanged.emit();
      },
    });
  }

  getStatusColor(status: Status): string {
    const colors: Record<string, string> = {
      'Completed': '#3ECF8E',
      'In Progress': '#FBBF24',
      'Pending': '#D1D5DB',
      'On Hold': '#8B5CF6',
    };
    return colors[status] || '#D1D5DB';
  }

  getTypeColor(taskType: string): string {
    const colors: Record<string, string> = {
      'Job Support': '#FADECE',
      'Technical Support': '#FDF2D0',
      'Software Dev': '#D7EDE7',
      'Documentation': '#E0E8EC',
      'Bug Fix': '#FECACA',
      'System Enquiries': '#BFDBFE',
    };
    return colors[taskType] || '#F3F1F0';
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'High': '#A73838',
      'Urgent': '#D98A3A',
      'Medium': '#7E8C92',
      'Low': '#9CA3AF',
    };
    return colors[priority] || '#D1D5DB';
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
    if (confirm('Are you sure?')) {
      this.delete.emit();
    }
  }

  statuses: Status[] = ['Pending', 'In Progress', 'On Hold', 'Completed'];
}
