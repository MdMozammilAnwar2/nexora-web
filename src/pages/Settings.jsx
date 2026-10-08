import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg, API_URL } from '../lib/api';
import { useAuth } from '../store/auth';
import { Avatar, Field, RoleBadge } from '../components/ui';
import { COLORS } from '../lib/constants';

export default function Settings() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: user.name, title: user.title || '', avatarColor: user.avatarColor });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  const save = async (e) => {
    e.preventDefault();
    try { const { data } = await api.patch('/auth/me', f); setUser(data.user); toast.success('Profile updated'); } catch (e) { toast.error(errMsg(e)); }
  };
  const change = async (e) => {
    e.preventDefault();
    try { await api.post('/auth/change-password', pw); setPw({ currentPassword: '', newPassword: '' }); toast.success('Password changed'); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
      <form onSubmit={save} className="card space-y-5 p-6">
        <div className="flex items-center gap-4">
          <Avatar user={{ ...user, ...f }} size={64} />
          <div><p className="text-lg font-bold">{f.name}</p><p className="text-sm text-slate-500">{user.email}</p><RoleBadge role={user.role} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Job title"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        </div>
        <div>
          <span className="label">Avatar color</span>
          <div className="flex flex-wrap gap-2">{COLORS.map((c) => <button type="button" key={c} onClick={() => setF({ ...f, avatarColor: c })} style={{ background: c }} className={`h-8 w-8 rounded-full ${f.avatarColor === c ? 'scale-110 ring-4 ring-offset-2' : ''}`} />)}</div>
        </div>
        <button className="btn-primary">Save profile</button>
      </form>
      <form onSubmit={change} className="card space-y-4 p-6">
        <h3 className="font-bold">Change password</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current password"><input required type="password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="New password"><input required minLength={8} type="password" className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
        </div>
        <button className="btn-outline">Update password</button>
      </form>
      <p className="text-center text-xs text-slate-400">Connected to {API_URL}</p>
    </div>
  );
}
