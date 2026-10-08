import { useState } from 'react';
import { UserPlus, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import useFetch from '../lib/useFetch';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../store/auth';
import { PageLoader, Avatar, Modal, Field } from '../components/ui';
import { ROLES } from '../lib/constants';

const ROLE_HELP = {
  admin: 'Full access to everything, manages users & roles',
  manager: 'Creates projects, manages sprints & members',
  member: 'Creates and updates issues in their projects',
  viewer: 'Read-only access to projects they are added to',
};

export default function Team() {
  const { user: me } = useAuth();
  const { data, loading, reload } = useFetch('/users');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'member', title: '' });

  const call = async (fn, msg) => {
    try { await fn(); toast.success(msg); reload(); return true; } catch (e) { toast.error(errMsg(e)); return false; }
  };
  const create = async (e) => {
    e.preventDefault();
    if (await call(() => api.post('/users', f), 'User created')) {
      setOpen(false);
      setF({ name: '', email: '', password: '', role: 'member', title: '' });
    }
  };

  if (loading || !data) return <PageLoader />;
  const users = data.users.filter((u) => (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  const counts = Object.fromEntries(Object.keys(ROLES).map((r) => [r, data.users.filter((u) => u.role === r).length]));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Team & Roles</h1>
          <p className="mt-1 text-slate-500">Invite people and control what they can do.</p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}><UserPlus size={16} /> Add user</button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Object.entries(ROLES).map(([k, r]) => (
          <div key={k} className="card p-4">
            <div className="flex items-center justify-between"><span className={`chip ${r.cls}`}>{r.label}</span><span className="text-2xl font-extrabold">{counts[k]}</span></div>
            <p className="mt-2 text-xs text-slate-500">{ROLE_HELP[k]}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input max-w-sm pl-9" placeholder="Search people" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Last login</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className={u.isActive ? '' : 'opacity-50'}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={u} size={36} />
                      <div><p className="font-semibold">{u.name} {u.id === me.id && <span className="text-xs text-slate-400">(you)</span>}</p><p className="text-xs text-slate-500">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <select disabled={u.id === me.id} className="input !w-32 !py-1.5" value={u.role} onChange={(e) => call(() => api.patch(`/users/${u.id}`, { role: e.target.value }), 'Role updated')}>
                      {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`chip ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.isActive ? 'Active' : 'Deactivated'}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{u.lastLoginAt ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true }) : 'Never'}</td>
                  <td className="px-5 py-3 text-right">
                    {u.id !== me.id && (
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost !px-2.5 !py-1.5 text-xs" onClick={() => { const p = prompt(`New password for ${u.name} (min 8 chars)`); if (p) call(() => api.patch(`/users/${u.id}`, { password: p }), 'Password reset'); }}>Reset password</button>
                        <button className="btn-ghost !px-2.5 !py-1.5 text-xs" onClick={() => call(() => api.patch(`/users/${u.id}`, { isActive: !u.isActive }), u.isActive ? 'Deactivated' : 'Activated')}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add user">
        <form onSubmit={create} className="space-y-4">
          <Field label="Full name"><input required className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email"><input required type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Job title"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Temporary password"><input required minLength={8} className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <div>
            <span className="label">Role</span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ROLES).map(([k, r]) => (
                <button type="button" key={k} onClick={() => setF({ ...f, role: k })} className={`rounded-xl border p-3 text-left transition ${f.role === k ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <p className="flex items-center gap-1 text-sm font-bold">{k === 'admin' && <ShieldCheck size={14} />}{r.label}</p>
                  <p className="text-[11px] text-slate-500">{ROLE_HELP[k]}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary">Create user</button></div>
        </form>
      </Modal>
    </div>
  );
}
