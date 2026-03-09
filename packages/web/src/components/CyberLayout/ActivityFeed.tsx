import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, ArrowRight, ChatCircle, FileText, User } from '@phosphor-icons/react';
import { activity as activityAPI } from '../../lib/api';

interface Activity {
  id: string;
  type: string;
  agentId: string | null;
  taskId: string | null;
  projectId: string | null;
  message: string;
  metadata: any;
  createdAt: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadActivities = async () => {
    try {
      const filters: any = { limit: 50 };
      if (filter !== 'all') {
        filters.type = filter;
      }
      
      const data = await activityAPI.feed(filters);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
        return <FileText size={16} weight="fill" className="text-cyber-cyan" />;
      case 'status_changed':
        return <CheckCircle size={16} weight="fill" className="text-cyber-green" />;
      case 'comment_added':
        return <ChatCircle size={16} weight="fill" className="text-cyber-purple" />;
      case 'agent_started':
        return <Clock size={16} weight="fill" className="text-cyber-yellow animate-pulse" />;
      case 'agent_completed':
        return <CheckCircle size={16} weight="fill" className="text-cyber-green" />;
      case 'decision_gate':
        return <User size={16} weight="fill" className="text-cyber-magenta" />;
      default:
        return <ArrowRight size={16} className="text-cyber-text-dim" />;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      task_created: 'Task Created',
      task_updated: 'Task Updated',
      status_changed: 'Status Changed',
      comment_added: 'Comment',
      agent_started: 'Agent Started',
      agent_completed: 'Agent Complete',
      decision_gate: 'Decision Gate',
    };
    return labels[type] || type;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-[272px] bg-cyber-bg-secondary border-l border-cyber-border flex flex-col z-40">
      {/* Header */}
      <div className="p-4 border-b border-cyber-border">
        <h3 className="font-heading text-sm font-bold text-cyber-cyan uppercase tracking-wider">
          Live Activity
        </h3>
        <p className="text-xs text-cyber-text-dim mt-1">Real-time agent updates</p>
      </div>

      {/* Filter */}
      <div className="px-4 py-2 border-b border-cyber-border">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full px-2 py-1 bg-cyber-bg-tertiary border border-cyber-border rounded text-xs text-cyber-text-primary font-mono focus:outline-none focus:border-cyber-cyan"
        >
          <option value="all">All Activity</option>
          <option value="task_created">Tasks</option>
          <option value="comment_added">Comments</option>
          <option value="status_changed">Status Changes</option>
          <option value="agent_started">Agent Activity</option>
          <option value="decision_gate">Decisions</option>
        </select>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && activities.length === 0 ? (
          <div className="text-center text-cyber-text-dim text-xs py-8">
            Loading...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-cyber-text-dim text-xs py-8">
            No activity yet
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity.id}
              className={`cyber-card p-3 fade-in-up stagger-${Math.min(index + 1, 6)}`}
            >
              {/* Type Badge + Icon */}
              <div className="flex items-center gap-2 mb-2">
                {activity.agentId && (
                  <span className="cyber-badge cyber-badge-info text-[10px] px-2 py-0.5">
                    {activity.agentId.replace('livescape-', '').toUpperCase()}
                  </span>
                )}
                {getIcon(activity.type)}
              </div>

              {/* Message */}
              <p className="text-sm text-cyber-text-primary font-medium mb-1">
                {activity.message}
              </p>

              {/* Metadata */}
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <p className="text-xs text-cyber-text-secondary font-mono leading-relaxed">
                  {JSON.stringify(activity.metadata, null, 2).substring(0, 100)}
                </p>
              )}

              {/* Timestamp */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-cyber-border">
                <span className="text-[10px] text-cyber-text-dim font-mono">
                  {formatTimestamp(activity.createdAt)}
                </span>
                <span className="text-[10px] text-cyber-text-dim uppercase tracking-wide">
                  {getActivityTypeLabel(activity.type)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-cyber-border">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-cyber-cyan">{activities.length}</div>
            <div className="text-[10px] text-cyber-text-dim uppercase tracking-wide">Shown</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-cyber-green">
              {activities.filter(a => a.type === 'agent_completed').length}
            </div>
            <div className="text-[10px] text-cyber-text-dim uppercase tracking-wide">Complete</div>
          </div>
        </div>
      </div>
    </div>
  );
}
