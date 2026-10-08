import { Bug, BookOpen, CheckSquare, Zap, GitBranch, ChevronsUp, ChevronUp, Equal, ChevronDown, ChevronsDown } from 'lucide-react';

export const STATUSES = [
  { id: 'todo', label: 'To Do', dot: 'bg-slate-400', soft: 'bg-slate-100 text-slate-700' },
  { id: 'in_progress', label: 'In Progress', dot: 'bg-blue-500', soft: 'bg-blue-50 text-blue-700' },
  { id: 'in_review', label: 'In Review', dot: 'bg-amber-500', soft: 'bg-amber-50 text-amber-700' },
  { id: 'done', label: 'Done', dot: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700' },
];
export const statusOf = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];

export const TYPES = {
  epic: { label: 'Epic', icon: Zap, cls: 'bg-violet-500' },
  story: { label: 'Story', icon: BookOpen, cls: 'bg-emerald-500' },
  task: { label: 'Task', icon: CheckSquare, cls: 'bg-sky-500' },
  bug: { label: 'Bug', icon: Bug, cls: 'bg-rose-500' },
  subtask: { label: 'Sub-task', icon: GitBranch, cls: 'bg-slate-500' },
};

export const PRIORITIES = {
  highest: { label: 'Highest', icon: ChevronsUp, cls: 'text-rose-600' },
  high: { label: 'High', icon: ChevronUp, cls: 'text-orange-500' },
  medium: { label: 'Medium', icon: Equal, cls: 'text-amber-500' },
  low: { label: 'Low', icon: ChevronDown, cls: 'text-sky-500' },
  lowest: { label: 'Lowest', icon: ChevronsDown, cls: 'text-slate-400' },
};

export const ROLES = {
  admin: { label: 'Admin', cls: 'bg-violet-100 text-violet-700' },
  manager: { label: 'Manager', cls: 'bg-indigo-100 text-indigo-700' },
  member: { label: 'Member', cls: 'bg-emerald-100 text-emerald-700' },
  viewer: { label: 'Viewer', cls: 'bg-slate-100 text-slate-600' },
};

export const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6'];
