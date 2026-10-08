import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import useFetch from '../lib/useFetch';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../store/auth';
import { PageLoader, Avatar, Empty, Modal, Field } from '../components/ui';
import { COLORS } from '../lib/constants';

function CreateProject({ open, onClose }) {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', key: '', description: '', color: COLORS[0] });
  const [busy, setBusy] = useState(false);
  const autoKey = (name) => name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean).map((w) => w[0]).join('').toUpperCase().slice(0, 4) || '';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/projects', f);
      toast.success('Project created');
      navigate(`/projects/${data.project.id}`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New project">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Project name">
          <input autoFocus required className="input" value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value, key: f.key && f.key !== autoKey(f.name) ? f.key : autoKey(e.target.value).padEnd(2, 'X') })} />
        </Field>
        <Field label="Key (used in issue IDs, e.g. KEY-12)">
          <input required className="input uppercase" maxLength={10} value={f.key} onChange={(e) => setF({ ...f, key: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Description">
          <textarea rows={3} className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <div>
          <span className="label">Color</span>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button type="button" key={c} onClick={() => setF({ ...f, color: c })} style={{ background: c }}
                className={`h-8 w-8 rounded-full transition ${f.color === c ? 'scale-110 ring-4 ring-offset-2' : ''}`} />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create project'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const { data, loading } = useFetch('/projects');
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const canCreate = ['admin', 'manager'].includes(user.role);
  if (loading || !data) return <PageLoader />;
  const projects = data.projects.filter((p) => (p.name + p.key).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Projects</h1>
          <p className="mt-1 text-slate-500">{data.projects.length} project{data.projects.length !== 1 && 's'} you can access</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input w-56 pl-9" placeholder="Search projects" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {canCreate && <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New project</button>}
        </div>
      </div>

      {projects.length === 0 ? (
        <Empty icon={FolderKanban} title="No projects yet"
          text={canCreate ? 'Create your first project to start tracking work.' : 'Ask a manager to add you to a project.'}
          action={canCreate && <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New project</button>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const pct = p.issueCount ? Math.round((p.doneCount / p.issueCount) * 100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-xl">
                <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${p.color}, ${p.color}66)` }} />
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-extrabold text-white shadow-lg" style={{ background: p.color }}>
                    {p.key.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold group-hover:text-indigo-600">{p.name}</h3>
                    <p className="text-xs font-semibold text-slate-400">{p.key} · Lead: {p.lead?.name || '—'}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 min-h-10 text-sm text-slate-500">{p.description || 'No description'}</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-500">
                    <span>{p.doneCount}/{p.issueCount} done</span><span>{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </div>
                <div className="mt-4 flex -space-x-2">
                  {p.members.slice(0, 6).map((m) => <Avatar key={m.id} user={m.user} size={28} ring />)}
                  {p.members.length > 6 && <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-bold ring-2 ring-white">+{p.members.length - 6}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <CreateProject open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
