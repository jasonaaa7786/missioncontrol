import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, X, CalendarBlank, User, Tag, MagnifyingGlass, Funnel } from '@phosphor-icons/react';
import { tasksV2, projects as projectsAPI } from '../lib/api';
import { toast } from 'sonner';
import TaskDetailModal from '../components/TaskDetailModal';

const STATUSES = [
  { key: 'inbox', label: 'Inbox', icon: '📥', color: 'text-cyber-text-dim' },
  { key: 'assigned', label: 'Assigned', icon: '📋', color: 'text-cyber-cyan' },
  { key: 'active', label: 'Active', icon: '⚡', color: 'text-cyber-yellow' },
  { key: 'review', label: 'Review', icon: '👀', color: 'text-cyber-purple' },
  { key: 'waiting', label: 'Waiting', icon: '⏳', color: 'text-cyber-text-secondary' },
  { key: 'blocked', label: 'Blocked', icon: '🚫', color: 'text-cyber-red' },
  { key: 'done', label: 'Done', icon: '✅', color: 'text-cyber-green' },
];

const PRIORITIES = ['urgent', 'high', 'normal', 'low'];

export default function Pipeline() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, projectsData] = await Promise.all([
        tasksV2.list(),
        projectsAPI.list(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await tasksV2.updateStatus(taskId, newStatus);
      await loadData();
      toast.success('Task status updated');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => {
      if (task.status !== status) return false;

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        const agentMatch = task.assignedAgent?.toLowerCase().includes(query);
        const tagsStr = task.tags ? JSON.parse(task.tags).join(' ').toLowerCase() : '';
        const tagMatch = tagsStr.includes(query);
        if (!titleMatch && !descMatch && !agentMatch && !tagMatch) return false;
      }

      // Apply priority filter
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

      return true;
    });
  };

  const filteredTaskCount = tasks.filter(task => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = task.title?.toLowerCase().includes(query);
      const descMatch = task.description?.toLowerCase().includes(query);
      const agentMatch = task.assignedAgent?.toLowerCase().includes(query);
      const tagsStr = task.tags ? JSON.parse(task.tags).join(' ').toLowerCase() : '';
      if (!titleMatch && !descMatch && !agentMatch && !tagsStr.includes(query)) return false;
    }
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  }).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-cyber-red bg-cyber-red/10';
      case 'high': return 'border-cyber-yellow bg-cyber-yellow/10';
      case 'normal': return 'border-cyber-cyan bg-cyber-cyan/10';
      case 'low': return 'border-cyber-text-dim bg-cyber-bg-tertiary';
      default: return 'border-cyber-border bg-cyber-bg-tertiary';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between fade-in-up">
        <div>
          <h1 className="cyber-heading text-4xl font-bold mb-2">Mission Queue</h1>
          <p className="text-cyber-text-secondary font-body">
            Task workflow — {tasks.length} total tasks
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="cyber-glow-hover"
        >
          <Plus size={20} className="mr-2" />
          New Task
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 fade-in-up stagger-1">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-dim" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title, description, agent, or tag..."
            className="w-full pl-9 pr-4 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary font-body placeholder-cyber-text-dim focus:outline-none focus:border-cyber-cyan transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-text-dim hover:text-cyber-cyan"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Funnel size={16} className="text-cyber-text-dim" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary font-mono focus:outline-none focus:border-cyber-cyan"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟡 High</option>
            <option value="normal">🔵 Normal</option>
            <option value="low">⚪ Low</option>
          </select>
        </div>
        {(searchQuery || priorityFilter !== 'all') && (
          <span className="text-xs text-cyber-text-dim font-mono whitespace-nowrap">
            {filteredTaskCount} of {tasks.length} tasks
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-7 gap-4 fade-in-up stagger-2">
        {STATUSES.map((status) => {
          const count = getTasksByStatus(status.key).length;
          return (
            <Card key={status.key} className="cyber-card cyber-glow-hover">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{status.icon}</span>
                  <span className="font-mono text-2xl font-bold">{count}</span>
                </div>
                <p className="text-xs text-cyber-text-dim uppercase tracking-wide">
                  {status.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="text-center py-12 text-cyber-text-dim">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-7 gap-4">
          {STATUSES.map((status, statusIndex) => (
            <div key={status.key} className={`fade-in-up stagger-${statusIndex + 2}`}>
              {/* Column Header */}
              <div className="cyber-card p-4 mb-4 sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{status.icon}</span>
                  <h3 className="font-heading text-sm font-bold uppercase">
                    {status.label}
                  </h3>
                </div>
                <div className="cyber-progress mt-3">
                  <div
                    className="cyber-progress-bar"
                    style={{
                      width: `${tasks.length > 0 ? (getTasksByStatus(status.key).length / tasks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Column Items */}
              <div className="space-y-3">
                {getTasksByStatus(status.key).map((task) => {
                  const tags = task.tags ? JSON.parse(task.tags) : [];
                  
                  return (
                    <Card
                      key={task.id}
                      className={`cyber-card cyber-glow-hover cursor-pointer ${getPriorityColor(task.priority)}`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <CardContent className="p-4">
                        {/* Priority Badge */}
                        {task.priority === 'urgent' && (
                          <div className="cyber-badge cyber-badge-error text-[10px] mb-2">
                            URGENT
                          </div>
                        )}

                        {/* Title */}
                        <h4 className="font-medium text-sm mb-2 line-clamp-2">{task.title}</h4>

                        {/* Tags */}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {tags.slice(0, 2).map((tag: string, i: number) => (
                              <span key={i} className="cyber-badge cyber-badge-info text-[9px] px-1 py-0">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-2 text-[10px] text-cyber-text-dim mt-2">
                          {task.assignedAgent && (
                            <div className="flex items-center gap-1">
                              <User size={10} />
                              <span className="font-mono uppercase">
                                {task.assignedAgent.replace('livescape-', '')}
                              </span>
                            </div>
                          )}
                          {task._count?.comments > 0 && (
                            <div className="flex items-center gap-1">
                              💬 <span>{task._count.comments}</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Status Change */}
                        <div className="mt-3 pt-2 border-t border-cyber-border">
                          <select
                            value={task.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(task.id, e.target.value);
                            }}
                            className="w-full px-2 py-1 bg-cyber-bg-tertiary border border-cyber-border rounded text-[10px] text-cyber-text-primary font-mono"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {STATUSES.map(s => (
                              <option key={s.key} value={s.key}>
                                {s.icon} {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {getTasksByStatus(status.key).length === 0 && (
                  <div className="cyber-card p-4 text-center">
                    <p className="text-xs text-cyber-text-dim">No tasks</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          projects={projects}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            setSelectedTask(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Create Task Modal Component
function CreateTaskModal({ projects, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '',
    title: '',
    description: '',
    priority: 'normal',
    assignedAgent: '',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await tasksV2.create({
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      });
      toast.success('Task created successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="cyber-card w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-bold">Create New Task</h2>
            <button onClick={onClose} className="text-cyber-text-dim hover:text-cyber-cyan">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-text-primary mb-2">Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-4 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary"
                required
              >
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-text-primary mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-text-primary mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cyber-text-primary mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-cyber-text-primary mb-2">Assigned Agent</label>
                <input
                  type="text"
                  value={formData.assignedAgent}
                  onChange={(e) => setFormData({ ...formData, assignedAgent: e.target.value })}
                  placeholder="livescape-scout"
                  className="w-full px-4 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-text-primary mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="strategy, gap-fill, urgent"
                className="w-full px-4 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button type="submit">
                Create Task
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

// Task Detail Modal (placeholder - to be enhanced)
