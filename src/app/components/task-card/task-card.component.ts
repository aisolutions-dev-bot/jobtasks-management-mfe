import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { JobTask } from '../../models/task.model';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AvatarComponent],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
})
export class TaskCardComponent {
  @Input() task!: JobTask;

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

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Completed': '#3ECF8E',
      'In Progress': '#FBBF24',
      'Pending': '#D1D5DB',
      'On Hold': '#8B5CF6',
    };
    return colors[status] || '#D1D5DB';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'Completed': 'Completed',
      'In Progress': 'In Progress',
      'Pending': 'Pending',
      'On Hold': 'On Hold',
    };
    return labels[status] || status;
  }

  isOverdue(): boolean {
    if (!this.task.dueDate || this.task.jobStatus === 'Completed') return false;
    return new Date(this.task.dueDate) < new Date();
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  }

  isCompleted(): boolean {
    return this.task.jobStatus === 'Completed';
  }
}
