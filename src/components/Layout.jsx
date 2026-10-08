import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, Settings, LogOut, Bell, Menu, X, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../store/auth';
import api from '../lib/api';
import { Avatar, RoleBadge } from './ui';

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 shadow-lg shadow-violet-500/30">
        <svg viewBox="0 0 64 64" className="h-5 w-5">
          <path d="M20 44V20l24 24V20" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-lg font-extrabold tracking-tight">Nexora</span>
    </div>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unread: 0 });
  const ref = useRef();
  const navigate = useNavigate();

  const load = () => api.get('/notifications').then((r) => setData(r.data)).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => {
      clearInterval(t);
      document.removeEventListener('mousedown', close);
    };
  }, []);

  const readAll = async () => {
    await api.post('/notifications/read-all');
    load();
  };
  const openOne = async (n) => {
    if (!n.read) api.patch(`/notifications/${n.id}/read`).then(load);
    setOpen(false);
    if (n.issueId) navigate(`/projects/${n.projectId}?issue=${n.issueId}`);
    else if (n.projectId) navigate(`/projects/${n.projectId}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
        <Bell size={20} />
        {data.unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="font-semibold">Notifications</span>
            <button onClick={readAll} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {data.notifications.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-400">You're all caught up ✨</p>}
            {data.notifications.map((n) => (
              <button key={n.id} onClick={() => openOne(n)} className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 ${n.read ? '' : 'bg-indigo-50/50'}`}>
                <Avatar user={n.actor} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  {n.body && <p className="truncate text-xs text-slate-500">{n.body}</p>}
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    ...(user.role === 'admin' ? [{ to: '/team', label: 'Team & Roles', icon: Users }] : []),
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/" onClick={() => setMobileOpen(false)}>
          <Logo />
        </Link>
        <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
        <div className="flex items-center gap-3">
          <Avatar user={user} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <RoleBadge role={user.role} />
          </div>
          <button title="Log out" onClick={logout} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/80 backdrop-blur lg:block">{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside className="h-full w-72 bg-white" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/70 px-4 backdrop-blur-xl sm:px-6">
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="hidden text-sm text-slate-500 lg:block">
            Welcome back, <span className="font-semibold text-slate-800">{user.name.split(' ')[0]}</span> 👋
          </div>
          <div className="flex items-center gap-2">
            <Notifications />
            <Link to="/settings">
              <Avatar user={user} size={34} />
            </Link>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
