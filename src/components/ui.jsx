import { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { TYPES, PRIORITIES, statusOf, ROLES } from '../lib/constants';

export function Avatar({ user, size = 28, ring = false }) {
  if (!user)
    return (
      <div style={{ width: size, height: size }} className="grid place-items-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
        ?
      </div>
    );
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      title={user.name}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${user.avatarColor || '#6366F1'}, ${user.avatarColor || '#6366F1'}bb)`, fontSize: size * 0.38 }}
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${ring ? 'ring-2 ring-white' : ''}`}
    >
      {initials}
    </div>
  );
}

export function TypeIcon({ type, size = 16 }) {
  const t = TYPES[type] || TYPES.task;
  const Icon = t.icon;
  return (
    <span title={t.label} style={{ width: size, height: size }} className={`grid shrink-0 place-items-center rounded ${t.cls}`}>
      <Icon size={size * 0.65} className="text-white" strokeWidth={2.75} />
    </span>
  );
}

export function PriorityIcon({ priority, size = 16 }) {
  const p = PRIORITIES[priority] || PRIORITIES.medium;
  const Icon = p.icon;
  return <Icon size={size} className={p.cls} strokeWidth={2.75} aria-label={p.label} />;
}

export function StatusPill({ status }) {
  const s = statusOf(status);
  return (
    <span className={`chip ${s.soft}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function RoleBadge({ role }) {
  const r = ROLES[role] || ROLES.member;
  return <span className={`chip ${r.cls}`}>{r.label}</span>;
}

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin text-indigo-500 ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="grid h-64 place-items-center">
      <Spinner className="h-7 w-7" />
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50">
          <Icon className="text-indigo-500" />
        </div>
      )}
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false, footer }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={`relative w-full ${wide ? 'max-w-5xl' : 'max-w-lg'} my-8 animate-[pop_.18s_ease-out] rounded-3xl bg-white shadow-2xl shadow-slate-900/20`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
      <style>{`@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-15`} />
      <div className={`mb-4 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
        <Icon size={18} />
      </div>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-1 text-sm font-medium text-slate-500">{label}</div>
    </div>
  );
}
