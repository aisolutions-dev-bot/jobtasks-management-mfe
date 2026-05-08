import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { CreateJobTaskRequest, Staff } from '../../models/task.model';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-task-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AvatarComponent],
  templateUrl: './task-form-modal.component.html',
  styleUrls: ['./task-form-modal.component.scss'],
})
export class TaskFormModalComponent {
  @Input() staff!: Staff[];
  @Input() me!: Staff;
  @Output() create = new EventEmitter<CreateJobTaskRequest>();
  @Output() cancel = new EventEmitter<void>();

  currentStep = signal(1);

  // Form data
  taskTitle = signal('');
  taskType = signal('');
  taskDescription = signal('');
  priority = signal('Medium');
  assignee = signal<Staff | null>(null);
  dueDate = signal('');

  taskTypes = [
    'Software Development',
    'Job Support',
    'System Enquiries',
    'Technical Support',
    'Bug Fix',
    'Documentation',
  ];

  priorities = ['Low', 'Medium', 'High', 'Urgent'];

  onNext() {
    if (this.currentStep() < 3) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  onBack() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  onSelectType(type: string) {
    this.taskType.set(type);
  }

  onSelectStaff(staff: Staff) {
    this.assignee.set(this.assignee() === staff ? null : staff);
  }

  onSelectPriority(priority: string) {
    this.priority.set(priority);
  }

  onCreate() {
    const request: CreateJobTaskRequest = {
      taskTitle: this.taskTitle(),
      taskType: this.taskType() as import("../../models/task.model").TaskType,
      taskDescription: this.taskDescription(),
      priority: this.priority() as import("../../models/task.model").Priority,
      assignorStaffId:   this.me?.staffCode || 0,
      assigneeStaffId:   this.assignee()?.staffCode || 0,
      dueDate: this.dueDate(),
    };
    this.create.emit(request);
  }

  onCancel() {
    this.cancel.emit();
  }

  get isStep1Valid(): boolean {
    return this.taskTitle().length > 0 && this.taskType().length > 0;
  }

  get isStep2Valid(): boolean {
    return this.assignee() !== null && this.priority().length > 0;
  }

  get isStep3Valid(): boolean {
    return this.taskDescription().length > 0;
  }
}
