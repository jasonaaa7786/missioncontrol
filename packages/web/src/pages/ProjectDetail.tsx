import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../lib/api';
import { activity as activityAPI } from '../lib/api';
import type { Project, Task, Agent } from '@mc/shared';
import { useAuth } from '../contexts/AuthContext';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard, DroppableColumn } from '../components/DnD';
import {
  ArrowLeft,
  PencilSimple,
  CheckCircle,
  Lightning,
  FileText,
  ChatCircle,
  ArrowRight,
  Clock,
  TrendUp,
  X,
} from '@phosphor-icons/react';
import { Skeleton } from '../components/ui/skeleton';

interface ActivityItem {
  id: string;
  type: string;
  agentId: string | null;
  message: string;
  metadata: any;
  createdAt: string;
}

export default function ProjectDetailDnD() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assignedAgent: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [projectData, tasksData, agentsData] = await Promise.all([
        api.projects.get(id),
        api.tasks.listByProject(id),
        api.agents.list(),
      ]);
      setProject(projectData);
      setTasks(tasksData);
      setAgents(agentsData);
      setError('');

      // Load activity in background
      try {
        const activityData = await activityAPI.feed({ projectId: id, limit: 5 });
        setActivities(activityData);
      } catch {
        // Activity is optional
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newTask.title.trim()) return;

    try {
      await api.tasks.create(id, {
        title: newTask.title,
        description: newTask.description || undefined,
        priority: newTask.priority,
        assignedAgent: newTask.assignedAgent || undefined,
      });
      setNewTask({ title: '', description: '', priority: 'medium', assignedAgent: '' });
      setShowCreateTask(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;

    try {
      await api.tasks.delete(taskId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    try {
      await api.tasks.update(taskId, { status: newStatus });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
    }
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(t => t.status === status);
  };

  // Progress calculation
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const statusColumns: { status: Task['status']; label: string; color: string }[] = [
    { status: 'backlog', label: 'Backlog', color: 'bg-cyber-bg-tertiary' },
    { status: 'planned', label: 'Planned', color: 'bg-purple-900/50' },
    { status: 'in_progress', label: 'In Progress', color: 'bg-blue-900/50' },
    { status: 'blocked', label: 'Blocked', color: 'bg-red-900/50' },
    { status: 'done', label: 'Done', color: 'bg-green-900/50' },
  ];

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-6 w-full" />
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <p className="text-cyber-red">{error || 'Project not found'}</p>
        <Link to="/projects" className="text-cyber-cyan hover:underline inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link to="/projects" className="text-cyber-cyan hover:underline inline-flex items-center gap-2 text-sm fade-in-up">
        <ArrowLeft size={14} /> Back to Projects
      </Link>

      {/* Header */}
      <div className="cyber-card p-6 fade-in-up stagger-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="cyber-heading text-3xl font-bold">{project.name}</h1>
              <span className={`cyber-badge text-[10px] px-2 py-0.5 ${
                project.status === 'active' ? 'cyber-badge-success' :
                project.status === 'paused' ? 'cyber-badge-warning' : 'cyber-badge-info'
              }`}>
                {project.status.toUpperCase()}
              </span>
              {isAdmin && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1.5 rounded hover:bg-cyber-bg-tertiary text-cyber-text-dim hover:text-cyber-cyan transition-colors"
                  title="Edit project"
                >
                  <PencilSimple size={16} />
                </button>
              )}
            </div>
            {project.description && (
              <p className="text-cyber-text-secondary text-sm mb-3">{project.description}</p>
            )}
            <div className="flex gap-4 text-xs text-cyber-text-dim font-mono">
              <span>Working: {project.workingDir}</span>
              {project.outputDir && <span>Output: {project.outputDir}</span>}
            </div>
          </div>
          <button
            onClick={() => setShowCreateTask(true)}
            className="cyber-btn px-4 py-2 text-sm font-heading uppercase tracking-wide"
          >
            + New Task
          </button>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-4 pt-4 border-t border-cyber-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cyber-text-dim font-heading uppercase tracking-wider">
                Progress
              </span>
              <span className="text-xs text-cyber-text-secondary font-mono">
                {doneCount} of {totalCount} tasks complete ({progressPct}%)
              </span>
            </div>
            <div className="cyber-progress">
              <div
                className="cyber-progress-bar"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {showEditModal && project && (
        <EditProjectModal
          project={project}
          agents={agents}
          onClose={() => setShowEditModal(false)}
          onSave={async (data) => {
            try {
              await api.projects.update(project.id, data);
              setShowEditModal(false);
              await loadData();
            } catch (err: any) {
              alert(err.message || 'Failed to update project');
            }
          }}
        />
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="cyber-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-cyber-cyan">CREATE TASK</h2>
              <button onClick={() => setShowCreateTask(false)} className="text-cyber-text-dim hover:text-cyber-cyan">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs text-cyber-text-dim uppercase tracking-wider mb-1 font-heading">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary font-body focus:outline-none focus:border-cyber-cyan"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-cyber-text-dim uppercase tracking-wider mb-1 font-heading">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary font-body h-20 focus:outline-none focus:border-cyber-cyan"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-cyber-text-dim uppercase tracking-wider mb-1 font-heading">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary font-mono focus:outline-none focus:border-cyber-cyan"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-cyber-text-dim uppercase tracking-wider mb-1 font-heading">Agent</label>
                  <select
                    value={newTask.assignedAgent}
                    onChange={(e) => setNewTask({ ...newTask, assignedAgent: e.target.value })}
                    className="w-full px-3 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary font-mono focus:outline-none focus:border-cyber-cyan"
                  >
                    <option value="">Unassigned</option>
                    {agents.filter(a => a.isActive).map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name || agent.id}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="cyber-btn flex-1 py-2 text-sm">Create</button>
                <button type="button" onClick={() => setShowCreateTask(false)} className="flex-1 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary hover:border-cyber-cyan">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drag and Drop Task Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-4 fade-in-up stagger-2">
          {statusColumns.map(({ status, label, color }) => {
            const columnTasks = getTasksByStatus(status);
            return (
              <DroppableColumn key={status} id={status} label={label} color={color} count={columnTasks.length}>
                <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {columnTasks.map(task => {
                      const assignedAgent = agents.find(a => a.id === task.assignedAgent);
                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          agent={assignedAgent}
                          onDelete={handleDeleteTask}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="cyber-card p-3 border-cyber-cyan shadow-2xl shadow-cyber-cyan/20 opacity-90">
              <h4 className="text-cyber-text-primary font-medium text-sm">{activeTask.title}</h4>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {tasks.length === 0 && (
        <div className="cyber-card p-12 text-center">
          <p className="text-cyber-text-dim">No tasks yet. Click "+ New Task" to create one.</p>
        </div>
      )}

      {/* Mini Activity Timeline */}
      {activities.length > 0 && (
        <div className="cyber-card p-6 fade-in-up stagger-3">
          <h3 className="font-heading text-sm font-bold text-cyber-cyan uppercase tracking-wider mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {activities.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cyber-text-primary truncate">
                    {formatActivityMessage(item)}
                  </p>
                  <p className="text-[10px] text-cyber-text-dim font-mono mt-0.5">
                    {formatTimeAgo(item.createdAt)}
                    {item.agentId && (
                      <> &middot; {item.agentId.replace('livescape-', '').toUpperCase()}</>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Helper functions ----

function getActivityIcon(type: string) {
  switch (type) {
    case 'task_created':
    case 'task_updated':
      return <FileText size={14} weight="fill" className="text-cyber-cyan" />;
    case 'status_changed':
      return <TrendUp size={14} className="text-cyber-cyan" />;
    case 'comment_added':
      return <ChatCircle size={14} weight="fill" className="text-cyber-purple" />;
    case 'agent_started':
      return <Lightning size={14} weight="fill" className="text-cyber-yellow" />;
    case 'agent_completed':
      return <CheckCircle size={14} weight="fill" className="text-cyber-green" />;
    default:
      return <ArrowRight size={14} className="text-cyber-text-dim" />;
  }
}

function formatActivityMessage(item: ActivityItem): string {
  const msg = item.message;
  if (msg.includes('heartbeat triggered')) return 'Agent completed routine check';
  if (msg.includes('heartbeat started')) return 'Agent started processing';
  return msg.length > 80 ? msg.substring(0, 77) + '...' : msg;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ---- Edit Project Modal ----

function EditProjectModal({ project, agents, onClose, onSave }: {
  project: Project;
  agents: Agent[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description || '',
    status: project.status,
    tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
    workingDir: project.workingDir,
    outputDir: project.outputDir || '',
    defaultAgent: project.defaultAgent || '',
    gitRepo: project.gitRepo || '',
    cadence: project.cadence || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: form.name,
        description: form.description || null,
        status: form.status,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        workingDir: form.workingDir,
        outputDir: form.outputDir || null,
        defaultAgent: form.defaultAgent || null,
        gitRepo: form.gitRepo || null,
        cadence: form.cadence || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="cyber-card p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-bold text-cyber-cyan">EDIT PROJECT</h2>
          <button onClick={onClose} className="text-cyber-text-dim hover:text-cyber-cyan">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="form-input"
              required
            />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-input h-20"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="form-input"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </Field>

            <Field label="Default Agent">
              <select
                value={form.defaultAgent}
                onChange={(e) => setForm({ ...form, defaultAgent: e.target.value })}
                className="form-input"
              >
                <option value="">None</option>
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name || a.id}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Tags (comma-separated)">
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="form-input"
              placeholder="strategy, research, urgent"
            />
          </Field>

          <Field label="Working Directory">
            <input
              type="text"
              value={form.workingDir}
              onChange={(e) => setForm({ ...form, workingDir: e.target.value })}
              className="form-input"
            />
          </Field>

          <Field label="Output Directory">
            <input
              type="text"
              value={form.outputDir}
              onChange={(e) => setForm({ ...form, outputDir: e.target.value })}
              className="form-input"
              placeholder="Optional"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Git Repo">
              <input
                type="text"
                value={form.gitRepo}
                onChange={(e) => setForm({ ...form, gitRepo: e.target.value })}
                className="form-input"
                placeholder="Optional"
              />
            </Field>
            <Field label="Cadence">
              <input
                type="text"
                value={form.cadence}
                onChange={(e) => setForm({ ...form, cadence: e.target.value })}
                className="form-input"
                placeholder="e.g. weekly"
              />
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="cyber-btn flex-1 py-2 text-sm disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary hover:border-cyber-cyan">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-cyber-text-dim uppercase tracking-wider mb-1 font-heading">{label}</label>
      {children}
    </div>
  );
}
