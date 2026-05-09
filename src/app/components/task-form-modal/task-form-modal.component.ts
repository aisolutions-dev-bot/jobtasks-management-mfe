import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { SelectModule } from 'primeng/select';
import { ListboxModule } from 'primeng/listbox';
import { DatePickerModule } from 'primeng/datepicker';
import { AvatarModule } from 'primeng/avatar';
import { CreateJobTaskRequest, Staff } from '../../models/task.model';

@Component({
  selector: 'app-task-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    SelectModule,
    ListboxModule,
    DatePickerModule,
    AvatarModule,
  ],
  templateUrl: './task-form-modal.component.html',
  styleUrls: ['./task-form-modal.component.scss'],
})
export class TaskFormModalComponent {
  @Input() staff: Staff[] = [];
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
  dueDate = signal<Date | null>(null);

  // Staff search for Step 2
  staffSearchQuery = signal('');
  filteredStaffList = computed(() => {
    const q = this.staffSearchQuery().toLowerCase().trim();
    if (!q) return this.staff;
    return this.staff.filter(s =>
      (s.name?.toLowerCase().includes(q) || false) ||
      (s.staffId?.toLowerCase().includes(q) || false)
    );
  });

  taskTypes = [
    'Job Support',
    'Technical Support',
    'Software Dev',
    'Documentation',
    'Bug Fix',
    'System Enquiries',
  ];

  priorities = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Urgent', value: 'Urgent' },
  ];

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
    this.taskType.set(this.taskType() === type ? '' : type);
  }

  onSelectStaff(staff: Staff) {
    this.assignee.set(this.assignee() === staff ? null : staff);
  }

  filterStaffList() {
    // The computed property handles the filtering automatically
    // This method is just for the (input) event trigger
  }

  onCreate() {
    const request: CreateJobTaskRequest = {
      taskTitle: this.taskTitle(),
      taskType: this.taskType(),
      taskDescription: this.taskDescription(),
      priority: this.priority(),
      assigneeStaffCode: this.assignee()?.staffCode || '',
      dueDate: this.dueDate() ? this.dueDate()!.toISOString() : '',
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
    return this.assignee() !== null && this.priority().length > 0 && this.dueDate() !== null;
  }

  get isStep3Valid(): boolean {
    return this.taskDescription().length > 0;
  }

  getStaffInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
