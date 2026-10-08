import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Search, Play, CheckCircle2, Trash2, UserPlus, KanbanSquare, ListTodo, Activity as ActivityIcon, Users, Settings2, Calendar, Target } from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO, format } from 'date-fns';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { STATUSES, COLORS } from '../lib/constants';
import { useAuth } from '../store/auth';
import { PageLoader, Avatar, TypeIcon, PriorityIcon, StatusPill, RoleBadge, Empty, Modal, Field } from '../components/ui';
import { IssueModal, CreateIssueModal, describeActivity } from '../components/IssueModal';

const newPos = (list, index) => {
  const prev = list[index - 1]?.position;
  const next = list[index]?.position;
  if (prev != null && next != null) return (prev + next) / 2;
  if (prev != null) return prev + 1000;
  if (next != null) return next - 1000;
  return 1000;
};

/* ======================= Board ======================= */
function IssueCard({ issue, onOpen, dragging }) {
  const overdue = issue.dueDate && issue.status !== 'done' && isPast(parseISO(issue.dueDate));
  return (
    <div onClick={() => onOpen(issue.id)}
      className={`cursor-pointer rounded-xl border bg-white p-3 transition ${dragging ? 'rotate-2 border-indigo-300 shadow-2xl' : 'border-slate-200/80 shadow-sm hover:border-indigo-200 hover:shadow-md'}`}>
      <p className="text-sm font-medium leading-snug text-slate-800">{issue.title}</p>
      {issue.labels?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {issue.labels.slice(0, 3).map((l) => <span key={l} className="chip bg-violet-50 text-violet-700">{l}</span>)}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <TypeIcon type={issue.type} size={15} />
        <span className={`text-[11px] font-bold ${issue.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-500'}`}>{issue.key}</span>
        {issue.dueDate && <span className={`flex items-center gap-0.5 text-[11px] ${overdue ? 'font-bold text-rose-600' : 'text-slate-400'}`}><Calendar size={11} />{format(parseISO(issue.dueDate), 'MMM d')}</span>}
        <div className="ml-auto flex items-center gap-1.5">
          {issue.storyPoints != null && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-slate-100 px-1 text-[10px] font-bold text-slate-600">{issue.storyPoints}</span>}
          <PriorityIcon priority={issue.priority} size={15} />
          <Avatar user={issue.assignee} size={22} />
        </div>
      </div>
    </div>
  );
}

function Board({ issues, setIssues, activeSprint, members, canEdit, onOpen, onCreate }) {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [who, setWho] = useState([]);
  const scoped = activeSprint ? issues.filter((i) => i.sprintId === activeSprint.id) : issues;
  const visible = scoped.filter(
    (i) => (!q || (i.title + i.key).toLowerCase().includes(q.toLowerCase())) && (!who.length || who.includes(i.assigneeId || 'none'))
  );
  const columns = STATUSES.map((s) => ({ ...s, items: visible.filter((i) => i.status === s.id).sort((a, b) => a.position - b.position) }));

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination || !canEdit) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const target = columns.find((c) => c.id === destination.droppableId).items.filter((i) => i.id !== draggableId);
    const position = newPos(target, destination.index);
    const status = destination.droppableId;
    const prev = issues;
    setIssues(issues.map((i) => (i.id === draggableId ? { ...i, status, position } : i)));
    try {
      await api.post(`/issues/${draggableId}/move`, { status, position });
    } catch (e) {
      setIssues(prev);
      toast.error(errMsg(e));
    }
  };

  const toggle = (id) => setWho(who.includes(id) ? who.filter((x) => x !== id) : [...who, id]);
  const points = scoped.reduce((s, i) => s + (i.storyPoints || 0), 0);
  const donePts = scoped.filter((i) => i.status === 'done').reduce((s, i) => s + (i.storyPoints || 0), 0);

  return (
    <div>
      {activeSprint ? (
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-4 text-white shadow-lg shadow-violet-500/20">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70"><Target size={14} /> Active sprint</p>
            <p className="text-lg font-bold">{activeSprint.name}</p>
            {activeSprint.goal && <p className="text-sm text-white/80">{activeSprint.goal}</p>}
          </div>
          <div className="text-sm">
            <p className="text-white/70">{activeSprint.startDate} → {activeSprint.endDate}</p>
            <div className="mt-1 h-2 w-48 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${points ? (donePts / points) * 100 : 0}%` }} />
            </div>
            <p className="mt-1 text-xs text-white/80">{donePts}/{points} points done</p>
          </div>
        </div>
      ) : (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No active sprint — showing all issues. Start a sprint from the <b>Backlog</b> tab to focus the board.
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input w-56 pl-9" placeholder="Search board" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex -space-x-1.5">
          {members.filter((m) => m.role !== 'viewer').map((m) => (
            <button key={m.user.id} onClick={() => toggle(m.user.id)} className={`rounded-full transition ${who.includes(m.user.id) ? 'z-10 scale-110 ring-2 ring-indigo-500 ring-offset-2' : 'hover:z-10 hover:-translate-y-0.5'}`}>
              <Avatar user={m.user} size={32} ring />
            </button>
          ))}
        </div>
        <button onClick={() => setWho(who.includes(user.id) && who.length === 1 ? [] : [user.id])} className={`chip !px-3 !py-1.5 !text-xs ${who.length === 1 && who[0] === user.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
          Only my issues
        </button>
        {(q || who.length > 0) && <button className="text-xs font-semibold text-slate-500 hover:text-slate-800" onClick={() => { setQ(''); setWho([]); }}>Clear filters</button>}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div key={col.id} className="flex w-72 shrink-0 flex-col rounded-2xl bg-slate-100/70 p-2.5 lg:w-auto lg:flex-1">
              <div className="mb-2 flex items-center justify-between px-1.5">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />{col.label}
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-600">{col.items.length}</span>
                </span>
                {canEdit && col.id === 'todo' && <button onClick={onCreate} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-indigo-600"><Plus size={16} /></button>}
              </div>
              <Droppable droppableId={col.id}>
                {(prov, snap) => (
                  <div ref={prov.innerRef} {...prov.droppableProps} className={`min-h-40 flex-1 space-y-2 rounded-xl p-0.5 transition ${snap.isDraggingOver ? 'bg-indigo-100/60' : ''}`}>
                    {col.items.map((issue, idx) => (
                      <Draggable key={issue.id} draggableId={issue.id} index={idx} isDragDisabled={!canEdit}>
                        {(p, s) => (
                          <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                            <IssueCard issue={issue} onOpen={onOpen} dragging={s.isDragging} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {prov.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

/* ======================= Backlog ======================= */
function IssueRow({ issue, onOpen, provided, dragging }) {
  return (
    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => onOpen(issue.id)}
      className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 bg-white px-4 py-2.5 last:border-0 hover:bg-slate-50 ${dragging ? 'rounded-xl shadow-xl' : ''}`}>
      <TypeIcon type={issue.type} />
      <span className="w-16 shrink-0 text-xs font-bold text-slate-500">{issue.key}</span>
      <span className="min-w-0 flex-1 truncate text-sm">{issue.title}</span>
      <StatusPill status={issue.status} />
      {issue.storyPoints != null && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-slate-100 px-1 text-[10px] font-bold">{issue.storyPoints}</span>}
      <PriorityIcon priority={issue.priority} />
      <Avatar user={issue.assignee} size={24} />
    </div>
  );
}

function Backlog({ project, issues, setIssues, sprints, reload, canEdit, canManage, onOpen, onCreate }) {
  const [completing, setCompleting] = useState(null);
  const groups = [
    ...sprints.map((s) => ({ id: s.id, sprint: s, items: issues.filter((i) => i.sprintId === s.id) })),
    { id: 'backlog', sprint: null, items: issues.filter((i) => !i.sprintId) },
  ].map((g) => ({ ...g, items: g.items.sort((a, b) => a.position - b.position) }));

  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination || !canEdit) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const target = groups.find((g) => g.id === destination.droppableId).items.filter((i) => i.id !== draggableId);
    const position = newPos(target, destination.index);
    const sprintId = destination.droppableId === 'backlog' ? null : destination.droppableId;
    const prev = issues;
    setIssues(issues.map((i) => (i.id === draggableId ? { ...i, sprintId, position } : i)));
    try {
      await api.post(`/issues/${draggableId}/move`, { sprintId, position });
    } catch (e) {
      setIssues(prev);
      toast.error(errMsg(e));
    }
  };

  const act = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
      reload();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-5">
        {groups.map((g) => {
          const pts = g.items.reduce((s, i) => s + (i.storyPoints || 0), 0);
          return (
            <div key={g.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{g.sprint ? g.sprint.name : 'Backlog'}</h3>
                    {g.sprint?.status === 'active' && <span className="chip bg-emerald-100 text-emerald-700">Active</span>}
                    <span className="text-xs text-slate-500">{g.items.length} issues · {pts} pts</span>
                  </div>
                  {g.sprint?.goal && <p className="text-xs text-slate-500">{g.sprint.goal}</p>}
                  {g.sprint?.startDate && <p className="text-xs text-slate-400">{g.sprint.startDate} → {g.sprint.endDate}</p>}
                </div>
                {g.sprint && canManage && g.sprint.status === 'planned' && (
                  <>
                    <button className="btn-outline !py-1.5" onClick={() => act(() => api.post(`/sprints/${g.sprint.id}/start`), 'Sprint started')}><Play size={14} /> Start sprint</button>
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete sprint"
                      onClick={() => confirm('Delete this sprint? Its issues go back to the backlog.') && act(() => api.delete(`/sprints/${g.sprint.id}`), 'Sprint deleted')}><Trash2 size={16} /></button>
                  </>
                )}
                {g.sprint && canManage && g.sprint.status === 'active' && (
                  <button className="btn-primary !py-1.5" onClick={() => setCompleting(g.sprint)}><CheckCircle2 size={14} /> Complete sprint</button>
                )}
                {!g.sprint && canManage && (
                  <button className="btn-outline !py-1.5" onClick={() => act(() => api.post(`/projects/${project.id}/sprints`, {}), 'Sprint created')}><Plus size={14} /> Create sprint</button>
                )}
                {!g.sprint && canEdit && <button className="btn-primary !py-1.5" onClick={onCreate}><Plus size={14} /> Issue</button>}
              </div>
              <Droppable droppableId={g.id}>
                {(prov, snap) => (
                  <div ref={prov.innerRef} {...prov.droppableProps} className={`min-h-14 ${snap.isDraggingOver ? 'bg-indigo-50' : ''}`}>
                    {g.items.length === 0 && !snap.isDraggingOver && <p className="px-4 py-4 text-center text-sm text-slate-400">Drag issues here</p>}
                    {g.items.map((issue, idx) => (
                      <Draggable key={issue.id} draggableId={issue.id} index={idx} isDragDisabled={!canEdit}>
                        {(p, s) => <IssueRow issue={issue} onOpen={onOpen} provided={p} dragging={s.isDragging} />}
                      </Draggable>
                    ))}
                    {prov.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
      <CompleteSprint sprint={completing} sprints={sprints} issues={issues} onClose={() => setCompleting(null)} onDone={() => { setCompleting(null); reload(); }} />
    </DragDropContext>
  );
}

function CompleteSprint({ sprint, sprints, issues, onClose, onDone }) {
  const [moveTo, setMoveTo] = useState('');
  if (!sprint) return null;
  const open = issues.filter((i) => i.sprintId === sprint.id && i.status !== 'done').length;
  const done = issues.filter((i) => i.sprintId === sprint.id && i.status === 'done').length;
  const submit = async () => {
    try {
      await api.post(`/sprints/${sprint.id}/complete`, { moveTo: moveTo || null });
      toast.success('Sprint completed 🎉');
      onDone();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  return (
    <Modal open onClose={onClose} title={`Complete ${sprint.name}`}
      footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>Complete sprint</button></>}>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-3xl font-extrabold text-emerald-600">{done}</p><p className="text-sm text-emerald-700">completed issues</p></div>
        <div className="rounded-2xl bg-amber-50 p-4"><p className="text-3xl font-extrabold text-amber-600">{open}</p><p className="text-sm text-amber-700">open issues</p></div>
      </div>
      {open > 0 && (
        <Field label="Move open issues to">
          <select className="input mt-1" value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            <option value="">Backlog</option>
            {sprints.filter((s) => s.status === 'planned').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
      )}
    </Modal>
  );
}

/* ======================= Members ======================= */
function Members({ project, members, reload, canManage }) {
  const [adding, setAdding] = useState(false);
  const [users, setUsers] = useState([]);
  const [pick, setPick] = useState({ userId: '', role: 'member' });
  useEffect(() => { if (adding) api.get('/users').then((r) => setUsers(r.data.users)); }, [adding]);
  const memberIds = members.map((m) => m.user.id);

  const call = async (fn, msg) => {
    try { await fn(); toast.success(msg); reload(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="font-bold">{members.length} members</h3>
        {canManage && <button className="btn-primary !py-2" onClick={() => setAdding(true)}><UserPlus size={16} /> Add member</button>}
      </div>
      <ul className="divide-y divide-slate-100">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 px-5 py-3">
            <Avatar user={m.user} size={38} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{m.user.name}</p>
              <p className="truncate text-xs text-slate-500">{m.user.email}{m.user.title ? ` · ${m.user.title}` : ''}</p>
            </div>
            {canManage ? (
              <>
                <select className="input !w-32 !py-1.5" value={m.role} onChange={(e) => call(() => api.patch(`/projects/${project.id}/members/${m.user.id}`, { role: e.target.value }), 'Role updated')}>
                  <option value="manager">Manager</option><option value="member">Member</option><option value="viewer">Viewer</option>
                </select>
                <button className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  onClick={() => confirm(`Remove ${m.user.name}?`) && call(() => api.delete(`/projects/${project.id}/members/${m.user.id}`), 'Member removed')}><Trash2 size={16} /></button>
              </>
            ) : <RoleBadge role={m.role} />}
          </li>
        ))}
      </ul>
      <Modal open={adding} onClose={() => setAdding(false)} title="Add member"
        footer={<><button className="btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          <button className="btn-primary" disabled={!pick.userId} onClick={() => call(() => api.post(`/projects/${project.id}/members`, pick), 'Member added').then(() => setAdding(false))}>Add</button></>}>
        <div className="space-y-4">
          <Field label="User">
            <select className="input" value={pick.userId} onChange={(e) => setPick({ ...pick, userId: e.target.value })}>
              <option value="">Select a user…</option>
              {users.filter((u) => !memberIds.includes(u.id)).map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </Field>
          <Field label="Project role">
            <select className="input" value={pick.role} onChange={(e) => setPick({ ...pick, role: e.target.value })}>
              <option value="manager">Manager — manage sprints, members, settings</option>
              <option value="member">Member — create & edit issues</option>
              <option value="viewer">Viewer — read-only</option>
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

/* ======================= Settings ======================= */
function ProjectSettings({ project, reload, isAdmin }) {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: project.name, description: project.description || '', color: project.color });
  const save = async (e) => {
    e.preventDefault();
    try { await api.patch(`/projects/${project.id}`, f); toast.success('Saved'); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const archive = async () => {
    try { await api.patch(`/projects/${project.id}`, { isArchived: !project.isArchived }); toast.success(project.isArchived ? 'Restored' : 'Archived'); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const del = async () => {
    if (prompt(`Type ${project.key} to permanently delete this project`) !== project.key) return;
    try { await api.delete(`/projects/${project.id}`); toast.success('Project deleted'); navigate('/projects'); } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={save} className="card space-y-4 p-6">
        <h3 className="font-bold">Details</h3>
        <Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Description"><textarea rows={4} className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div>
          <span className="label">Color</span>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => <button type="button" key={c} onClick={() => setF({ ...f, color: c })} style={{ background: c }} className={`h-8 w-8 rounded-full ${f.color === c ? 'scale-110 ring-4 ring-offset-2' : ''}`} />)}
          </div>
        </div>
        <button className="btn-primary">Save changes</button>
      </form>
      <div className="card space-y-3 border-rose-200 p-6">
        <h3 className="font-bold text-rose-600">Danger zone</h3>
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={archive}>{project.isArchived ? 'Restore project' : 'Archive project'}</button>
          {isAdmin && <button className="btn-danger" onClick={del}><Trash2 size={16} /> Delete project</button>}
        </div>
      </div>
    </div>
  );
}

/* ======================= Page ======================= */
export default function ProjectView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [project, setProject] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [issues, setIssues] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState('board');
  const [creating, setCreating] = useState(false);
  const openIssue = params.get('issue');

  const load = useCallback(async () => {
    try {
      const [p, i] = await Promise.all([api.get(`/projects/${id}`), api.get(`/projects/${id}/issues`)]);
      setProject(p.data.project);
      setMyRole(p.data.myRole);
      setIssues(i.data.issues);
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'activity') api.get(`/projects/${id}/activity`).then((r) => setActivity(r.data.activity)); }, [tab, id]);

  const sprints = useMemo(() => project?.sprints || [], [project]);
  const activeSprint = sprints.find((s) => s.status === 'active');
  if (!project) return <PageLoader />;

  const canEdit = ['admin', 'manager', 'member'].includes(myRole);
  const canManage = ['admin', 'manager'].includes(myRole);
  const setOpen = (issueId) => setParams(issueId ? { issue: issueId } : {});

  const tabs = [
    { id: 'board', label: 'Board', icon: KanbanSquare },
    { id: 'backlog', label: 'Backlog', icon: ListTodo },
    { id: 'activity', label: 'Activity', icon: ActivityIcon },
    { id: 'members', label: 'Members', icon: Users },
    ...(canManage ? [{ id: 'settings', label: 'Settings', icon: Settings2 }] : []),
  ];

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl text-base font-extrabold text-white shadow-lg" style={{ background: project.color }}>{project.key.slice(0, 3)}</div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{project.name}</h1>
          <p className="text-sm text-slate-500">{project.key} · {issues.length} issues · your role: <RoleBadge role={myRole === 'admin' ? 'admin' : myRole} /></p>
        </div>
        {canEdit && <button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> Create issue</button>}
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map(({ id: t, label, icon: Icon }) => (
          <button key={t} onClick={() => setTab(t)}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Icon size={16} />{label}
          </button>
        ))}
      </div>

      {tab === 'board' && <Board issues={issues} setIssues={setIssues} activeSprint={activeSprint} members={project.members} canEdit={canEdit} onOpen={setOpen} onCreate={() => setCreating(true)} />}
      {tab === 'backlog' && <Backlog project={project} issues={issues} setIssues={setIssues} sprints={sprints} reload={load} canEdit={canEdit} canManage={canManage} onOpen={setOpen} onCreate={() => setCreating(true)} />}
      {tab === 'activity' && (
        <div className="card max-w-3xl p-5">
          {activity.length === 0 ? <Empty icon={ActivityIcon} title="No activity yet" /> : (
            <ul className="space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <Avatar user={a.user} size={32} />
                  <div><p><b>{a.user?.name}</b> <span className="text-slate-600">{describeActivity(a)}</span></p>
                    <p className="text-xs text-slate-400">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</p></div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {tab === 'members' && <Members project={project} members={project.members} reload={load} canManage={canManage} />}
      {tab === 'settings' && canManage && <ProjectSettings project={project} reload={load} isAdmin={user.role === 'admin'} />}

      <CreateIssueModal open={creating} onClose={() => setCreating(false)} projectId={project.id} members={project.members} sprints={sprints}
        defaults={tab === 'board' && activeSprint ? { sprintId: activeSprint.id } : {}} onCreated={(i) => setIssues((prev) => [...prev, i])} />
      {openIssue && (
        <IssueModal issueId={openIssue} onClose={() => setOpen(null)} members={project.members} sprints={sprints} canEdit={canEdit}
          onChanged={(u) => setIssues((prev) => prev.map((i) => (i.id === u.id ? { ...i, ...u } : i)))}
          onDeleted={(rid) => setIssues((prev) => prev.filter((i) => i.id !== rid))} />
      )}
    </div>
  );
}
