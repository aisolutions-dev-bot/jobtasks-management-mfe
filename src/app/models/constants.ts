import { Priority, Status, TaskType } from './task.model';

export interface TaskTypeMeta {
  id:    TaskType;
  label: string;
  icon:  string;             // lucide icon name
  tone:  ToneKey;
}

export type ToneKey = 'green' | 'orange' | 'blue' | 'rust' | 'red' | 'slate';

export interface Tone { fg: string; bg: string; border: string; }

export const TONES: Record<ToneKey, Tone> = {
  green:  { fg: '#1F3D2F', bg: '#E6EFE8', border: '#C9DBCD' },
  orange: { fg: '#9A3412', bg: '#FCEBDC', border: '#F4CBA3' },
  blue:   { fg: '#1E40AF', bg: '#E2EAF7', border: '#BCCDEB' },
  rust:   { fg: '#7C2D12', bg: '#F8DFD0', border: '#E8B89C' },
  red:    { fg: '#991B1B', bg: '#FBDDDD', border: '#F0B5B5' },
  slate:  { fg: '#3F3F46', bg: '#E8E7E4', border: '#CFCDC8' },
};

export const TASK_TYPES: TaskTypeMeta[] = [
  { id: 'Software Development', label: 'Software Development', icon: 'code-2',         tone: 'green'  },
  { id: 'Job Support',          label: 'Job Support',          icon: 'life-buoy',      tone: 'orange' },
  { id: 'System Enquiries',     label: 'System Enquiries',     icon: 'help-circle',    tone: 'blue'   },
  { id: 'Technical Support',    label: 'Technical Support',    icon: 'message-square', tone: 'rust'   },
  { id: 'Bug Fix',              label: 'Bug Fix',              icon: 'bug',            tone: 'red'    },
  { id: 'Documentation',        label: 'Documentation',        icon: 'file-text',      tone: 'slate'  },
];

export interface PriorityMeta { id: Priority; fg: string; bg: string; }

export const PRIORITIES: PriorityMeta[] = [
  { id: 'Low',    fg: '#52525B', bg: '#EFEEEA' },
  { id: 'Medium', fg: '#1E40AF', bg: '#E2EAF7' },
  { id: 'High',   fg: '#9A3412', bg: '#FCEBDC' },
  { id: 'Urgent', fg: '#991B1B', bg: '#FBDDDD' },
];

export interface StatusMeta { id: Status; icon: string; fg: string; }

export const STATUSES: StatusMeta[] = [
  { id: 'Pending',     icon: 'circle',          fg: '#71717A' },
  { id: 'In Progress', icon: 'clock',           fg: '#9A3412' },
  { id: 'On Hold',     icon: 'pause-circle',    fg: '#854D0E' },
  { id: 'Completed',   icon: 'check-circle-2',  fg: '#15803D' },
];

/* -------------------------------------------------- */
/* Lookup helpers                                     */
/* -------------------------------------------------- */

export function typeMeta(id: TaskType): TaskTypeMeta {
  return TASK_TYPES.find(t => t.id === id) ?? TASK_TYPES[0];
}

export function priorityMeta(id: Priority): PriorityMeta {
  return PRIORITIES.find(p => p.id === id) ?? PRIORITIES[1];
}

export function statusMeta(id: Status): StatusMeta {
  return STATUSES.find(s => s.id === id) ?? STATUSES[0];
}

export function initials(name: string): string {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

/** Returns a human-readable due-date label and a tone bucket for colour. */
export function formatDue(iso: string | null): { label: string; tone: 'normal' | 'soon' | 'urgent' | 'overdue' } | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return { label: 'Due today',                 tone: 'urgent'  };
  if (diff <  0)  return { label: `Overdue by ${Math.abs(diff)}d`, tone: 'overdue' };
  if (diff <= 2)  return { label: `Due in ${diff}d`,           tone: 'urgent'  };
  if (diff <= 7)  return { label: `Due in ${diff}d`,           tone: 'soon'    };
  return { label: `Due ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`, tone: 'normal' };
}
