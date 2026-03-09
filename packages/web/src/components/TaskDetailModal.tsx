import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { X, ChatCircle, User, Clock, PaperPlaneRight } from '@phosphor-icons/react';
import { tasksV2 } from '../lib/api';
import { toast } from 'sonner';

interface TaskDetailModalProps {
  task: any;
  onClose: () => void;
  onUpdate: () => void;
}

const STATUSES = ['inbox', 'assigned', 'active', 'review', 'waiting', 'blocked', 'done'];
const PRIORITIES = ['urgent', 'high', 'normal', 'low'];

export default function TaskDetailModal({ task: initialTask, onClose, onUpdate }: TaskDetailModalProps) {
  const [task, setTask] = useState(initialTask);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assignedAgent: task.assignedAgent || '',
  });

  useEffect(() => {
    loadComments();
  }, [task.id]);

  const loadComments = async () => {
    try {
      const data = await tasksV2.getComments(task.id);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await tasksV2.addComment(task.id, {
        content: newComment,
        agentId: null, // Human comment
        mentions: extractMentions(newComment),
      });
      setNewComment('');
      await loadComments();
      toast.success('Comment added');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    setLoading(true);
    try {
      await tasksV2.update(task.id, editData);
      toast.success('Task updated');
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(`@${match[1]}`);
    }
    return mentions;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tags = task.tags ? JSON.parse(task.tags) : [];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="cyber-card w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-cyber-border flex items-start justify-between">
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full px-4 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary font-heading text-xl font-bold"
              />
            ) : (
              <h2 className="font-heading text-2xl font-bold mb-2">{task.title}</h2>
            )}
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              {task.priority === 'urgent' && (
                <span className="cyber-badge cyber-badge-error">URGENT</span>
              )}
              {tags.map((tag: string, i: number) => (
                <span key={i} className="cyber-badge cyber-badge-info text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <button onClick={onClose} className="text-cyber-text-dim hover:text-cyber-cyan ml-4">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-cyber-text-dim uppercase mb-2">Status</h3>
              {editing ? (
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary text-sm"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.toUpperCase()}</option>
                  ))}
                </select>
              ) : (
                <span className="cyber-badge cyber-badge-info">{task.status}</span>
              )}
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-cyber-text-dim uppercase mb-2">Priority</h3>
              {editing ? (
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary text-sm"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p.toUpperCase()}</option>
                  ))}
                </select>
              ) : (
                <span className="cyber-badge cyber-badge-warning">{task.priority}</span>
              )}
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-cyber-text-dim uppercase mb-2">Assigned To</h3>
              {editing ? (
                <input
                  type="text"
                  value={editData.assignedAgent}
                  onChange={(e) => setEditData({ ...editData, assignedAgent: e.target.value })}
                  placeholder="livescape-scout"
                  className="w-full px-3 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary text-sm font-mono"
                />
              ) : (
                <span className="text-cyber-text-secondary font-mono text-sm">
                  {task.assignedAgent ? task.assignedAgent.replace('livescape-', '').toUpperCase() : 'Unassigned'}
                </span>
              )}
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-cyber-text-dim uppercase mb-2">Project</h3>
              <span className="text-cyber-text-secondary text-sm">
                {task.project?.name || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-cyber-text-primary mb-2">Description</h3>
            {editing ? (
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="w-full px-4 py-3 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary h-32"
              />
            ) : (
              <p className="text-cyber-text-secondary">
                {task.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Comments Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ChatCircle size={20} className="text-cyber-cyan" />
              <h3 className="text-sm font-semibold text-cyber-text-primary">
                Comments ({comments.length})
              </h3>
            </div>

            {/* Comments List */}
            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <p className="text-cyber-text-dim text-sm py-4 text-center">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => {
                  const mentions = comment.mentions ? JSON.parse(comment.mentions) : [];
                  
                  return (
                    <div key={comment.id} className="cyber-card p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {comment.agentId ? (
                            <div className="w-8 h-8 rounded-full bg-cyber-cyan/20 flex items-center justify-center">
                              <User size={16} className="text-cyber-cyan" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-cyber-purple/20 flex items-center justify-center">
                              <User size={16} className="text-cyber-purple" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {comment.agentId 
                                ? comment.agentId.replace('livescape-', '').toUpperCase()
                                : 'Human'
                              }
                            </span>
                            <span className="text-xs text-cyber-text-dim font-mono">
                              {formatTimestamp(comment.createdAt)}
                            </span>
                          </div>
                          
                          <p className="text-cyber-text-secondary text-sm whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          
                          {mentions.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {mentions.map((mention: string, i: number) => (
                                <span key={i} className="text-xs text-cyber-cyan font-mono">
                                  {mention}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment... (use @agent to mention)"
                className="flex-1 px-4 py-3 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary placeholder-cyber-text-dim focus:outline-none focus:border-cyber-cyan"
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !newComment.trim()}>
                <PaperPlaneRight size={20} />
              </Button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-cyber-border flex justify-between items-center">
          <div className="text-xs text-cyber-text-dim font-mono">
            Created: {formatTimestamp(task.createdAt)}
          </div>
          
          <div className="flex gap-3">
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => setEditing(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateTask} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={() => setEditing(true)}>
                  Edit Task
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
