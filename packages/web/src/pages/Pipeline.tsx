import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, X, User, MagnifyingGlass, Funnel, CheckSquare, Square, ArrowsOutCardinal } from '@phosphor-icons/react';
import { tasksV2, projects as projectsAPI } from '../lib/api';
import { toast } from 'sonner';
import TaskDetailModal from '../components/TaskDetailModal';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';

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

  // Drag state
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Bulk select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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

  // Live updates via WebSocket
  const silentReload = useCallback(async () => {
    try {
      const data = await tasksV2.list();
      setTasks(data);
    } catch {}
  }, []);

  useWebSocket({
    onEvent: {
      task_created: silentReload,
      task_status_changed: silentReload,
      task_updated: silentReload,
      task_deleted: silentReload,
    },
  });

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
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        const agentMatch = task.assignedAgent?.toLowerCase().includes(query);
        const tagsStr = task.tags ? JSON.parse(task.tags).join(' ').toLowerCase() : '';
        const tagMatch = tagsStr.includes(query);
        if (!titleMatch && !descMatch && !agentMatch && !tagMatch) return false;
      }
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

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Only update if dropped on a valid column with different status
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Check it's a valid status column
    if (!STATUSES.find(s => s.key === newStatus)) return;

    await handleStatusChange(taskId, newStatus);
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
  };

  // Bulk select handlers
  const toggleSelect = (taskId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleBulkMove = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedIds).map(id => tasksV2.updateStatus(id, bulkStatus))
      );
      toast.success(`Moved ${selectedIds.size} tasks to ${STATUSES.find(s => s.key === bulkStatus)?.label}`);
      setSelectedIds(new Set());
      setSelectMode(false);
      setBulkStatus('');
      await loadData();
    } catch (error) {
      console.error('Bulk move failed:', error);
      toast.error('Failed to move some tasks');
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setBulkStatus('');
  };

  const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;

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
        <div className="flex items-center gap-3">
          <Button
            onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
            variant={selectMode ? 'default' : 'outline'}
            className={selectMode ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan' : ''}
          >
            {selectMode ? <CheckSquare size={18} className="mr-2" /> : <Square size={18} className="mr-2" />}
            {selectMode ? 'Exit Select' : 'Select Mode'}
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="cyber-glow-hover"
          >
            <Plus size={20} className="mr-2" />
            New Task
          </Button>
        </div>
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

      {/* Kanban Board with DnD */}
      {loading ? (
        <div className="text-center py-12 text-cyber-text-dim">Loading tasks...</div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-7 gap-4">
            {STATUSES.map((status, statusIndex) => (
              <DroppableColumn
                key={status.key}
                id={status.key}
                isActive={activeTaskId !== null}
                statusIndex={statusIndex}
              >
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
                  {getTasksByStatus(status.key).map((task) => (
                    <DraggableTaskCard
                      key={task.id}
                      task={task}
                      getPriorityColor={getPriorityColor}
                      selectMode={selectMode}
                      isSelected={selectedIds.has(task.id)}
                      onToggleSelect={() => toggleSelect(task.id)}
                      onClickTask={() => !selectMode && setSelectedTask(task)}
                      onStatusChange={handleStatusChange}
                      isDragActive={activeTaskId !== null}
                    />
                  ))}

                  {getTasksByStatus(status.key).length === 0 && (
                    <div className="cyber-card p-4 text-center">
                      <p className="text-xs text-cyber-text-dim">No tasks</p>
                    </div>
                  )}
                </div>
              </DroppableColumn>
            ))}
          </div>

          {/* Drag Overlay — ghost card while dragging */}
          <DragOverlay>
            {activeTask ? (
              <div className={`cyber-card p-4 border-2 border-cyber-cyan shadow-lg shadow-cyber-cyan/20 opacity-90 rotate-2 ${getPriorityColor(activeTask.priority)}`}>
                {activeTask.priority === 'urgent' && (
                  <div className="cyber-badge cyber-badge-error text-[10px] mb-2">URGENT</div>
                )}
                <h4 className="font-medium text-sm mb-1 line-clamp-2">{activeTask.title}</h4>
                <div className="flex items-center gap-1 text-[10px] text-cyber-cyan">
                  <ArrowsOutCardinal size={10} />
                  <span className="font-mono">DRAGGING</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Bulk Action Bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 fade-in-up">
          <div className="cyber-card border-cyber-cyan border-2 px-6 py-4 flex items-center gap-4 shadow-lg shadow-cyber-cyan/20">
            <span className="text-sm font-mono text-cyber-cyan font-bold">
              {selectedIds.size} selected
            </span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-3 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary font-mono focus:outline-none focus:border-cyber-cyan"
            >
              <option value="">Move to...</option>
              {STATUSES.map(s => (
                <option key={s.key} value={s.key}>{s.icon} {s.label}</option>
              ))}
            </select>
            <Button
              onClick={handleBulkMove}
              disabled={!bulkStatus}
              className="cyber-glow-hover"
              size="sm"
            >
              Move
            </Button>
            <button
              onClick={exitSelectMode}
              className="text-cyber-text-dim hover:text-cyber-cyan text-sm font-mono"
            >
              Clear
            </button>
          </div>
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

// ─── Droppable Column ───────────────────────────────────────────────
function DroppableColumn({
  id,
  isActive,
  statusIndex,
  children,
}: {
  id: string;
  isActive: boolean;
  statusIndex: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`fade-in-up stagger-${statusIndex + 2} transition-all rounded-lg ${
        isOver
          ? 'ring-2 ring-cyber-cyan/50 bg-cyber-cyan/5'
          : isActive
            ? 'ring-1 ring-cyber-border/30'
            : ''
      }`}
    >
      {children}
    </div>
  );
}

// ─── Draggable Task Card ────────────────────────────────────────────
function DraggableTaskCard({
  task,
  getPriorityColor,
  selectMode,
  isSelected,
  onToggleSelect,
  onClickTask,
  onStatusChange,
  isDragActive,
}: {
  task: any;
  getPriorityColor: (p: string) => string;
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClickTask: () => void;
  onStatusChange: (id: string, status: string) => void;
  isDragActive: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: selectMode,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const tags = task.tags ? JSON.parse(task.tags) : [];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cyber-card cursor-pointer transition-all ${getPriorityColor(task.priority)} ${
        isDragging ? 'opacity-30' : ''
      } ${isSelected ? 'ring-2 ring-cyber-cyan shadow-lg shadow-cyber-cyan/10' : ''} ${
        !selectMode && !isDragActive ? 'cyber-glow-hover' : ''
      }`}
      onClick={() => selectMode ? onToggleSelect() : onClickTask()}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          {/* Drag handle (visible when not in select mode) */}
          {!selectMode && (
            <div
              {...attributes}
              {...listeners}
              className="mt-0.5 text-cyber-text-dim hover:text-cyber-cyan cursor-grab active:cursor-grabbing shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ArrowsOutCardinal size={14} />
            </div>
          )}

          {/* Select checkbox */}
          {selectMode && (
            <div className="mt-0.5 shrink-0">
              {isSelected ? (
                <CheckSquare size={16} className="text-cyber-cyan" />
              ) : (
                <Square size={16} className="text-cyber-text-dim" />
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
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

            {/* Quick Status Change (dropdown fallback) */}
            {!selectMode && (
              <div className="mt-3 pt-2 border-t border-cyber-border">
                <select
                  value={task.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, e.target.value);
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Create Task Modal ──────────────────────────────────────────────
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
