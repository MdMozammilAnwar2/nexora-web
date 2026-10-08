import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, KanbanSquare, Users, Zap } from 'lucide-react';
import { useAuth } from '../store/auth';
import { errMsg } from '../lib/api';

export default function Auth({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (isLogin) await login(f.email, f.password);
      else await register(f.name, f.email, f.password);
      navigate('/');
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-pink-400/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 backdrop-blur">
            <svg viewBox="0 0 64 64" className="h-6 w-6"><path d="M20 44V20l24 24V20" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span className="text-2xl font-extrabold">Nexora</span>
        </div>
        <div className="relative">
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight">Plan, track and ship<br />work your team loves.</h1>
          <p className="mt-4 max-w-md text-lg text-white/80">Boards, sprints, backlogs and roles — on web, desktop and mobile.</p>
          <div className="mt-10 grid max-w-md gap-3">
            {[[KanbanSquare, 'Drag-and-drop kanban boards'], [Zap, 'Sprints & backlog planning'], [Users, 'Admin, manager, member & viewer roles']].map(([I, t]) => (
              <div key={t} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur"><I size={18} />{t}</div>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-white/60">© {new Date().getFullYear()} Nexora</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h2 className="text-3xl font-extrabold tracking-tight">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-sm text-slate-500">{isLogin ? 'Sign in to continue to your workspace.' : 'The very first account becomes the workspace admin.'}</p>
          <div className="mt-8 space-y-4">
            {!isLogin && (
              <div><label className="label">Full name</label><input required className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            )}
            <div><label className="label">Email</label><input required type="email" autoComplete="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div><label className="label">Password</label><input required type="password" minLength={isLogin ? 1 : 8} autoComplete={isLogin ? 'current-password' : 'new-password'} className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
            <button className="btn-primary w-full !py-3" disabled={busy}>
              {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'} <ArrowRight size={16} />
            </button>
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link className="font-semibold text-indigo-600 hover:underline" to={isLogin ? '/register' : '/login'}>{isLogin ? 'Sign up' : 'Sign in'}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
