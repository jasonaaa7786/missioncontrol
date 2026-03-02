import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import type { Project, Task, Agent } from '@mc/shared';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedAgent: '',
  });

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

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await api.tasks.update(taskId, { status: newStatus });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task');
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

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(t => t.status === status);
  };

  const statusColumns: { status: Task['status']; label: string; color: string }[] = [
    { status: 'todo', label: 'To Do', color: 'bg-gray-700' },
    { status: 'in_progress', label: 'In Progress', color: 'bg-blue-700' },
    { status: 'in_review', label: 'In Review', color: 'bg-yellow-700' },
    { status: 'blocked', label: 'Blocked', color: 'bg-red-700' },
    { status: 'done', label: 'Done', color: 'bg-green-700' },
  ];

  const priorityColors = {
    low: 'text-gray-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <p className="text-red-400">{error || 'Project not found'}</p>
        <Link to="/projects" className="text-blue-400 hover:underline mt-4 inline-block">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/projects" className="text-blue-400 hover:underline mb-4 inline-block">
          ← Back to Projects
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            {project.description && (
              <p className="text-gray-400 mt-2">{project.description}</p>
            )}
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>Working: {project.workingDir}</span>
              {project.outputDir && <span>Output: {project.outputDir}</span>}
            </div>
          </div>
          <button
            onClick={() => setShowCreateTask(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Assign to Agent</label>
                <select
                  value={newTask.assignedAgent}
                  onChange={(e) => setNewTask({ ...newTask, assignedAgent: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="">Unassigned</option>
                  {agents.filter(a => a.isActive).map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name || agent.id}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTask(false);
                    setNewTask({ title: '', description: '', priority: 'medium', assignedAgent: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Board */}
      <div className="grid grid-cols-5 gap-4">
        {statusColumns.map(({ status, label, color }) => {
          const columnTasks = getTasksByStatus(status);
          return (
            <div key={status} className="bg-gray-800 rounded-lg border border-gray-700">
              <div className={`${color} px-4 py-3 rounded-t-lg`}>
                <h3 className="font-semibold text-white">
                  {label} ({columnTasks.length})
                </h3>
              </div>
              <div className="p-3 space-y-3 min-h-[200px]">
                {columnTasks.map(task => {
                  const assignedAgent = agents.find(a => a.id === task.assignedAgent);
                  return (
                    <div
                      key={task.id}
                      className="bg-gray-700 rounded p-3 border border-gray-600 hover:border-gray-500"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-medium text-sm flex-1">{task.title}</h4>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-gray-400 hover:text-red-400 text-xs ml-2"
                        >
                          ×
                        </button>
                      </div>
                      {task.description && (
                        <p className="text-gray-400 text-xs mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className={priorityColors[task.priority]}>
                          {task.priority.toUpperCase()}
                        </span>
                        {assignedAgent && (
                          <span className="text-gray-500">{assignedAgent.name || assignedAgent.id}</span>
                        )}
                      </div>
                      {/* Status change dropdown */}
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                        className="w-full mt-2 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No tasks yet. Click "+ New Task" to create one.</p>
        </div>
      )}
    </div>
  );
}
