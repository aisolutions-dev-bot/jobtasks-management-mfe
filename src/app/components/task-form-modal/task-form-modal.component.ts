import { CommonModule }                                          from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit }         from '@angular/core';
import { FormsModule }                                            from '@angular/forms';
import { LucideAngularModule }                                    from 'lucide-angular';

import { CreateJobTaskRequest, Priority, Staff, TaskType }        from '../../models/task.model';
import { PRIORITIES, TASK_TYPES, TONES }                          from '../../models/constants';
import { AvatarComponent }                                        from '../avatar/avatar.component';

@Component({
  selector: 'app-task-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AvatarComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
         style="background: rgba(26,26,26,0.45); backdrop-filter: blur(4px);"
         (click)="closeModal()">

      <div class="w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden flex flex-col bg-parchment border-rule"
           style="max-height: 90vh"
           (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="px-6 pt-6 pb-4 flex items-start justify-between border-b border-ruleSoft">
          <div>
            <div class="text-xs uppercase tracking-widest text-muted">
              New job task · Step {{ step }} of 3
            </div>
            <h2 class="font-serif" style="font-size: 32px; line-height: 1.05; margin-top: 4px;">
              <ng-container [ngSwitch]="step">
                <span *ngSwitchCase="1">What needs doing?</span>
                <span *ngSwitchCase="2">Who should handle it?</span>
                <span *ngSwitchCase="3">Tell them more.</span>
              </ng-container>
            </h2>
          </div>
          <button type="button" (click)="closeModal()" class="p-1 rounded-md hover:bg-stone-100">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <!-- Progress bar -->
        <div class="px-6 pt-3">
          <div class="flex gap-1.5">
            <div *ngFor="let n of [1,2,3]"
                 class="h-1 flex-1 rounded-full transition-all"
                 [style.background]="n <= step ? '#1A1A1A' : '#E0D8C5'"></div>
          </div>
        </div>

        <!-- Body (scrollable) -->
        <div class="px-6 py-6 overflow-y-auto flex-1">

          <!-- ========= STEP 1 ========= -->
          <div *ngIf="step === 1" class="space-y-5">
            <div>
              <div class="text-sm font-medium mb-1.5">Task title <span style="color:#9A3412">·</span></div>
              <input
                #titleInput
                type="text"
                [(ngModel)]="title"
                placeholder="e.g. Refactor the login flow to use JWT"
                class="w-full px-3 py-2 text-base rounded-md border outline-none bg-parchment border-rule">
            </div>

            <div>
              <div class="text-sm font-medium mb-1.5">Task type <span style="color:#9A3412">·</span></div>
              <div class="text-xs mb-2 text-muted">Pick the category that fits best.</div>
              <div class="grid grid-cols-2 gap-2">
                <button *ngFor="let t of typesList"
                        type="button"
                        (click)="type = t.id"
                        class="flex items-center gap-2 px-3 py-3 rounded-md border text-sm font-medium text-left transition-all"
                        [style.border-color]="type === t.id ? '#1A1A1A' : '#E0D8C5'"
                        [style.background]="type === t.id ? TONES[t.tone].bg : '#FFFDF8'"
                        [style.color]="type === t.id ? TONES[t.tone].fg : '#1A1A1A'">
                  <span class="w-7 h-7 rounded flex items-center justify-center"
                        [style.background]="type === t.id ? TONES[t.tone].fg : TONES[t.tone].bg"
                        [style.color]="type === t.id ? TONES[t.tone].bg : TONES[t.tone].fg">
                    <lucide-icon [name]="t.icon" [size]="14"></lucide-icon>
                  </span>
                  {{ t.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- ========= STEP 2 ========= -->
          <div *ngIf="step === 2" class="space-y-5">
            <div>
              <div class="text-sm font-medium mb-1.5">Assign to staff <span style="color:#9A3412">·</span></div>
              <div class="text-xs mb-2 text-muted">From your m03Staff directory.</div>
              <div class="grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto pr-1">
                <button *ngFor="let s of selectableStaff"
                        type="button"
                        (click)="assigneeId = s.staffCode"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-all"
                        [style.border-color]="assigneeId === s.staffCode ? '#1A1A1A' : '#E0D8C5'"
                        [style.background]="assigneeId === s.staffCode ? '#F4EFE3' : '#FFFDF8'">
                  <app-avatar [staff]="s" [size]="32"></app-avatar>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium">{{ s.name }}</div>
                    <div class="text-xs text-muted">{{ s.appointment }} · {{ s.department }}</div>
                  </div>
                  <lucide-icon *ngIf="assigneeId === s.staffCode" name="check" [size]="16" style="color: #1F3D2F;"></lucide-icon>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm font-medium mb-1.5">Priority</div>
                <div class="grid grid-cols-2 gap-1.5">
                  <button *ngFor="let p of prioritiesList"
                          type="button"
                          (click)="priority = p.id"
                          class="px-2.5 py-2 rounded-md text-sm font-medium border transition-all"
                          [style.border-color]="priority === p.id ? p.fg : '#E0D8C5'"
                          [style.background]="priority === p.id ? p.bg : '#FFFDF8'"
                          [style.color]="priority === p.id ? p.fg : '#1A1A1A'">
                    {{ p.id }}
                  </button>
                </div>
              </div>

              <div>
                <div class="text-sm font-medium mb-1.5">Due date</div>
                <input type="date"
                       [(ngModel)]="dueDate"
                       class="w-full px-3 py-2 text-sm rounded-md border outline-none bg-parchment border-rule">
              </div>
            </div>
          </div>

          <!-- ========= STEP 3 ========= -->
          <div *ngIf="step === 3" class="space-y-5">
            <div>
              <div class="text-sm font-medium mb-1.5">Description / Requirements <span style="color:#9A3412">·</span></div>
              <div class="text-xs mb-2 text-muted">Be specific — context, expected outcome, links.</div>
              <textarea
                #descInput
                rows="9"
                [(ngModel)]="description"
                placeholder="What does done look like? Are there any constraints, dependencies, or stakeholders to involve?"
                class="w-full px-3 py-2 text-sm rounded-md border outline-none resize-none bg-parchment border-rule"
                style="font-family: inherit"></textarea>
              <div class="text-xs mt-1 text-right text-muted">{{ description.length }} chars</div>
            </div>

            <!-- Review summary -->
            <div class="rounded-md p-4 bg-cream border border-rule">
              <div class="text-xs uppercase tracking-wider mb-2 text-muted">Review</div>
              <div class="text-sm space-y-1.5">
                <div class="flex gap-2"><span class="w-20 text-muted">Title</span>   <span class="font-medium">{{ title || '—' }}</span></div>
                <div class="flex gap-2"><span class="w-20 text-muted">Type</span>    <span>{{ type || '—' }}</span></div>
                <div class="flex gap-2"><span class="w-20 text-muted">Assignee</span><span>{{ assigneeName() }}</span></div>
                <div class="flex gap-2"><span class="w-20 text-muted">Priority</span><span>{{ priority }}</span></div>
                <div class="flex gap-2"><span class="w-20 text-muted">Due</span>     <span>{{ dueDate || '—' }}</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t flex items-center justify-between border-ruleSoft" style="background: #F9F4E7;">
          <button type="button"
                  (click)="step === 1 ? closeModal() : prevStep()"
                  class="text-sm px-3 py-2 rounded-md hover:bg-stone-100">
            {{ step === 1 ? 'Cancel' : 'Back' }}
          </button>

          <button *ngIf="step < 3"
                  type="button"
                  (click)="nextStep()"
                  [disabled]="!canAdvance()"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-30"
                  style="background: #1A1A1A;">
            Next <lucide-icon name="arrow-right" [size]="14"></lucide-icon>
          </button>

          <button *ngIf="step === 3"
                  type="button"
                  (click)="submit()"
                  [disabled]="!canSubmit()"
                  class="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-30"
                  style="background: #1F3D2F;">
            <lucide-icon name="check" [size]="14"></lucide-icon> Create &amp; assign
          </button>
        </div>
      </div>
    </div>
  `,
})
export class TaskFormModalComponent implements OnInit {
  @Input({ required: true }) currentUser!: Staff;
  @Input({ required: true }) staff: Staff[] = [];

  @Output() close   = new EventEmitter<void>();
  @Output() created = new EventEmitter<CreateJobTaskRequest>();

  step = 1;
  title       = '';
  type:        TaskType | '' = '';
  assigneeId:  number | null = null;
  priority:    Priority      = 'Medium';
  dueDate     = '';
  description = '';

  // Expose constants to the template
  readonly typesList      = TASK_TYPES;
  readonly prioritiesList = PRIORITIES;
  readonly TONES          = TONES;

  ngOnInit() { /* fields default-initialised above */ }

  get selectableStaff(): Staff[] {
    return this.staff.filter(s => s.staffId !== this.currentUser.staffId);
  }

  assigneeName(): string {
    const s = this.staff.find(x => x.staffCode === this.assigneeId);
    return s ? s.name : '—';
  }

  canAdvance(): boolean {
    if (this.step === 1) return this.title.trim().length > 0 && this.type !== '';
    if (this.step === 2) return this.assigneeId !== null;
    return false;
  }

  canSubmit(): boolean {
    return this.description.trim().length > 0;
  }

  nextStep() { if (this.canAdvance()) this.step++; }
  prevStep() { if (this.step > 1)     this.step--; }
  closeModal() { this.close.emit(); }

  submit() {
    if (!this.canSubmit() || this.assigneeId === null || this.type === '') return;
    const payload: CreateJobTaskRequest = {
      taskTitle:        this.title.trim(),
      taskType:         this.type,
      taskDescription:  this.description.trim(),
      assignorStaffId:  this.currentUser.staffCode,
      assigneeStaffId:  this.assigneeId,
      priority:         this.priority,
      dueDate:          this.dueDate || null,
    };
    this.created.emit(payload);
  }
}
