import { useEffect, useState } from 'react';
import { X, Trash2, Send, Calendar, Hash, Tag, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { STATUSES, TYPES, PRIORITIES } from '../lib/constants';
import { Avatar, TypeIcon, PriorityIcon, Spinner, Modal, Field } from './ui';
import { useAuth } from '../store/auth';

/* ---------------- Create ---------------- */
export function CreateIssueModal({ open, onClose, projectId, members, sprints, defaults = {}, onCreated }) {
  const blank = { title: '', description: '', type: 'task', priority: 'medium', status: 'todo', assigneeId: '', sprintId: '', storyPoints: '', dueDate: '', ...defaults };
  const [f, setF] = useState(blank);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setF({ ...blank }); /* eslint-disable-next-line */ }, [open]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        title: f.title,
        description: f.description || undefined,
        type: f.type,
        priority: f.priority,
        status: f.status,
        assigneeId: f.assigneeId || null,
        sprintId: f.sprintId || null,
        storyPoints: f.storyPoints === '' ? null : Number(f.storyPoints),
        dueDate: f.dueDate || null,
      };
      const { data } = await api.post(`/projects/${projectId}/issues`, body);
      toast.success(`${data.issue.key} created`);
      onCreated?.(data.issue);
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create issue">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select className="input" value={f.type} onChange={set('type')}>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className="input" value={f.priority} onChange={set('priority')}>
              {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Summary">
          <input autoFocus required className="input" placeholder="What needs to be done?" value={f.title} onChange={set('title')} />
        </Field>
        <Field label="Description">
          <textarea rows={4} className="input resize-y" placeholder="Add more detail…" value={f.description} onChange={set('description')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignee">
            <select className="input" value={f.assigneeId} onChange={set('assigneeId')}>
              <option value="">Unassigned</option>
              {members.filter((m) => m.role !== 'viewer').map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
            </select>
          </Field>
          <Field label="Sprint">
            <select className="input" value={f.sprintId} onChange={set('sprintId')}>
              <option value="">Backlog</option>
              {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}{s.status === 'active' ? ' (active)' : ''}</option>)}
            </select>
          </Field>
          <Field label="Story points">
            <input type="number" min="0" max="100" className="input" value={f.storyPoints} onChange={set('storyPoints')} />
          </Field>
          <Field label="Due date">
            <input type="date" className="input" value={f.dueDate} onChange={set('dueDate')} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create issue'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Detail ---------------- */
function Row({ icon: Icon, label, children }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2 py-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">{Icon && <Icon size={13} />}{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const sel = 'w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium hover:border-slate-200 hover:bg-white focus:border-indigo-300 focus:outline-none disabled:hover:border-transparent';

export function IssueModal({ issueId, onClose, members = [], sprints = [], canEdit, onChanged, onDeleted }) {
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState('comments');
  const [comment, setComment] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);

  useEffect(() => {
    if (!issueId) return;
    setIssue(null);
    Promise.all([api.get(`/issues/${issueId}`), api.get(`/issues/${issueId}/comments`), api.get(`/issues/${issueId}/activity`)])
      .then(([a, b, c]) => {
        setIssue(a.data.issue);
        setTitle(a.data.issue.title);
        setDesc(a.data.issue.description || '');
        setComments(b.data.comments);
        setActivity(c.data.activity);
      })
      .catch((e) => {
        toast.error(errMsg(e));
        onClose();
      });
  }, [issueId]); // eslint-disable-line

  const update = async (patch) => {
    const prev = issue;
    setIssue({ ...issue, ...patch });
    try {
      const { data } = await api.patch(`/issues/${issue.id}`, patch);
      setIssue(data.issue);
      onChanged?.(data.issue);
      api.get(`/issues/${issue.id}/activity`).then((r) => setActivity(r.data.activity));
    } catch (e) {
      setIssue(prev);
      toast.error(errMsg(e));
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const { data } = await api.post(`/issues/${issue.id}/comments`, { body: comment });
      setComments([...comments, data.comment]);
      setComment('');
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const delComment = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments(comments.filter((c) => c.id !== id));
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const remove = async () => {
    if (!confirm(`Delete ${issue.key}? This cannot be undone.`)) return;
    try {
      await api.delete(`/issues/${issue.id}`);
      toast.success('Issue deleted');
      onDeleted?.(issue.id);
      onClose();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  if (!issueId) return null;
  return (
    <Modal open onClose={onClose} wide>
      {!issue ? (
        <div className="grid h-96 place-items-center"><Spinner className="h-7 w-7" /></div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <TypeIcon type={issue.type} />
              {issue.key}
            </div>
            <div className="flex items-center gap-1">
              {canEdit && (
                <button onClick={remove} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Delete">
                  <Trash2 size={18} />
                </button>
              )}
              <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0">
              <input
                disabled={!canEdit}
                className="-mx-2 w-full rounded-lg border border-transparent px-2 py-1 text-2xl font-bold tracking-tight outline-none hover:border-slate-200 focus:border-indigo-300 disabled:bg-transparent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => title.trim() && title !== issue.title && update({ title: title.trim() })}
              />

              <h4 className="label mt-6">Description</h4>
              {editingDesc ? (
                <div>
                  <textarea autoFocus rows={6} className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
                  <div className="mt-2 flex gap-2">
                    <button className="btn-primary !py-1.5" onClick={() => { update({ description: desc }); setEditingDesc(false); }}>Save</button>
                    <button className="btn-ghost !py-1.5" onClick={() => { setDesc(issue.description || ''); setEditingDesc(false); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => canEdit && setEditingDesc(true)}
                  className={`min-h-16 whitespace-pre-wrap rounded-xl p-3 text-sm leading-relaxed text-slate-700 ${canEdit ? 'cursor-text hover:bg-slate-50' : ''}`}
                >
                  {issue.description || <span className="text-slate-400">{canEdit ? 'Click to add a description…' : 'No description'}</span>}
                </div>
              )}

              {issue.children?.length > 0 && (
                <>
                  <h4 className="label mt-6">Child issues</h4>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {issue.children.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <TypeIcon type={c.type} size={14} />
                        <span className="font-semibold text-slate-500">{c.key}</span>
                        <span className="truncate">{c.title}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-8 flex gap-4 border-b border-slate-100">
                {['comments', 'history'].map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 pb-2 text-sm font-semibold capitalize ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>
                    {t} {t === 'comments' && `(${comments.length})`}
                  </button>
                ))}
              </div>

              {tab === 'comments' ? (
                <div className="mt-4 space-y-4">
                  <form onSubmit={addComment} className="flex gap-3">
                    <Avatar user={user} size={34} />
                    <div className="flex flex-1 gap-2">
                      <input className="input" placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
                      <button className="btn-primary !px-3" disabled={!comment.trim()}><Send size={16} /></button>
                    </div>
                  </form>
                  {comments.map((c) => (
                    <div key={c.id} className="group flex gap-3">
                      <Avatar user={c.author} size={34} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold">{c.author?.name}</span>
                          <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                          {c.author?.id === user.id && (
                            <button onClick={() => delComment(c.id)} className="ml-auto text-xs text-slate-400 opacity-0 hover:text-rose-600 group-hover:opacity-100">Delete</button>
                          )}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap rounded-xl rounded-tl-sm bg-slate-50 px-3 py-2 text-sm text-slate-700">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {activity.map((a) => (
                    <li key={a.id} className="flex gap-3 text-sm">
                      <Avatar user={a.user} size={26} />
                      <div>
                        <span className="font-semibold">{a.user?.name}</span>{' '}
                        <span className="text-slate-600">{describeActivity(a)}</span>
                        <div className="text-xs text-slate-400">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <aside className="h-fit space-y-1 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <select disabled={!canEdit} value={issue.status} onChange={(e) => update({ status: e.target.value })}
                className="mb-3 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-sm font-bold text-white outline-none disabled:opacity-80">
                {STATUSES.map((s) => <option key={s.id} value={s.id} className="text-slate-900">{s.label}</option>)}
              </select>
              <Row label="Assignee">
                <div className="flex items-center gap-1">
                  <Avatar user={issue.assignee} size={22} />
                  <select disabled={!canEdit} className={sel} value={issue.assigneeId || ''} onChange={(e) => update({ assigneeId: e.target.value || null })}>
                    <option value="">Unassigned</option>
                    {members.filter((m) => m.role !== 'viewer').map((m) => <option key={m.user.id} value={m.user.id}>{m.user.name}</option>)}
                  </select>
                </div>
              </Row>
              <Row label="Reporter">
                <div className="flex items-center gap-2 px-2 text-sm font-medium"><Avatar user={issue.reporter} size={22} />{issue.reporter?.name || '—'}</div>
              </Row>
              <Row label="Type">
                <select disabled={!canEdit} className={sel} value={issue.type} onChange={(e) => update({ type: e.target.value })}>
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </Row>
              <Row label="Priority">
                <div className="flex items-center gap-1">
                  <PriorityIcon priority={issue.priority} />
                  <select disabled={!canEdit} className={sel} value={issue.priority} onChange={(e) => update({ priority: e.target.value })}>
                    {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </Row>
              <Row label="Sprint">
                <select disabled={!canEdit} className={sel} value={issue.sprintId || ''} onChange={(e) => update({ sprintId: e.target.value || null })}>
                  <option value="">Backlog</option>
                  {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </Row>
              <Row icon={Hash} label="Points">
                <input disabled={!canEdit} type="number" min="0" className={sel} defaultValue={issue.storyPoints ?? ''}
                  onBlur={(e) => { const v = e.target.value === '' ? null : Number(e.target.value); if (v !== issue.storyPoints) update({ storyPoints: v }); }} />
              </Row>
              <Row icon={Calendar} label="Due date">
                <input disabled={!canEdit} type="date" className={sel} value={issue.dueDate || ''} onChange={(e) => update({ dueDate: e.target.value || null })} />
              </Row>
              <Row icon={Tag} label="Labels">
                <input disabled={!canEdit} className={sel} placeholder="comma, separated" defaultValue={(issue.labels || []).join(', ')}
                  onBlur={(e) => { const labels = e.target.value.split(',').map((s) => s.trim()).filter(Boolean); if (labels.join() !== (issue.labels || []).join()) update({ labels }); }} />
              </Row>
              <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5"><Clock size={12} /> Created {format(new Date(issue.createdAt), 'MMM d, yyyy')}</div>
                <div className="flex items-center gap-1.5"><Clock size={12} /> Updated {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}</div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </Modal>
  );
}

const label = (s) => (STATUSES.find((x) => x.id === s)?.label || s);
export function describeActivity(a) {
  const m = a.meta || {};
  switch (a.action) {
    case 'issue.created': return `created ${m.key}`;
    case 'issue.status': return `moved ${m.key} from ${label(m.changes?.status?.from)} → ${label(m.changes?.status?.to)}`;
    case 'issue.updated': return `updated ${Object.keys(m.changes || {}).join(', ')} on ${m.key}`;
    case 'issue.deleted': return `deleted ${m.key}`;
    case 'comment.added': return `commented on ${m.key}`;
    case 'sprint.created': return `created sprint ${m.name}`;
    case 'sprint.started': return `started sprint ${m.name}`;
    case 'sprint.completed': return `completed sprint ${m.name}`;
    case 'member.added': return `added ${m.name} to the project`;
    case 'project.created': return `created the project`;
    case 'project.updated': return `updated project settings`;
    default: return a.action;
  }
}
