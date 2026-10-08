import { Link } from 'react-router-dom';
import { FolderKanban, CircleDot, AlertTriangle, CheckCircle2, Inbox } from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import useFetch from '../lib/useFetch';
import { PageLoader, StatCard, TypeIcon, PriorityIcon, StatusPill, Avatar, Empty } from '../components/ui';
import { STATUSES } from '../lib/constants';
import { describeActivity } from '../components/IssueModal';

export default function Dashboard() {
  const { data, loading } = useFetch('/dashboard');
  if (loading || !data) return <PageLoader />;
  const { stats, myIssues, activity } = data;
  const total = Object.values(stats.byStatus).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-slate-500">Here's what's happening across your projects.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="Active projects" value={stats.projects} gradient="from-indigo-500 to-violet-500" />
        <StatCard icon={CircleDot} label="Assigned to me" value={stats.myOpen} gradient="from-sky-500 to-cyan-500" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} gradient="from-rose-500 to-orange-500" />
        <StatCard icon={CheckCircle2} label="Done this week" value={stats.doneThisWeek} gradient="from-emerald-500 to-teal-500" />
      </div>

      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-bold">Work by status</h3>
          <span className="text-sm text-slate-500">{Object.values(stats.byStatus).reduce((a, b) => a + b, 0)} issues</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
          {STATUSES.map((s) => <div key={s.id} className={s.dot} style={{ width: `${((stats.byStatus[s.id] || 0) / total) * 100}%` }} />)}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          {STATUSES.map((s) => (
            <span key={s.id} className="flex items-center gap-2 text-slate-600"><span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />{s.label} <b>{stats.byStatus[s.id] || 0}</b></span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-bold">My open issues</h3></div>
          {myIssues.length === 0 ? (
            <div className="p-5"><Empty icon={Inbox} title="Nothing assigned" text="Issues assigned to you will show up here." /></div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {myIssues.map((i) => (
                <li key={i.id}>
                  <Link to={`/projects/${i.projectId}?issue=${i.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <TypeIcon type={i.type} />
                    <span className="w-20 shrink-0 text-xs font-semibold text-slate-500">{i.key}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.title}</span>
                    {i.dueDate && <span className={`hidden text-xs sm:inline ${isPast(parseISO(i.dueDate)) ? 'font-semibold text-rose-600' : 'text-slate-400'}`}>{i.dueDate}</span>}
                    <PriorityIcon priority={i.priority} />
                    <StatusPill status={i.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-bold">Recent activity</h3></div>
          <ul className="max-h-[520px] space-y-4 overflow-y-auto p-5">
            {activity.length === 0 && <li className="text-sm text-slate-400">No activity yet.</li>}
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <Avatar user={a.user} size={30} />
                <div className="min-w-0">
                  <p><b>{a.user?.name}</b> <span className="text-slate-600">{describeActivity(a)}</span></p>
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold" style={{ color: a.project?.color }}>{a.project?.key}</span> · {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
