import { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, ArrowRight } from '@phosphor-icons/react';

interface Activity {
  id: string;
  type: 'success' | 'pending' | 'error';
  agent: string;
  message: string;
  timestamp: string;
  details?: string;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'success',
      agent: 'SCOUT',
      message: 'Artist brief generated',
      details: 'KI/KI - TIER 2 (Score: 68/100)',
      timestamp: '2m ago',
    },
    {
      id: '2',
      type: 'success',
      agent: 'META',
      message: 'Campaign sync complete',
      details: 'ASOT Vietnam 2026 - ROAS 11.99x',
      timestamp: '15m ago',
    },
    {
      id: '3',
      type: 'pending',
      agent: 'PULSE',
      message: 'Sentiment analysis running',
      details: 'Analyzing 2,341 social posts...',
      timestamp: 'Now',
    },
    {
      id: '4',
      type: 'success',
      agent: 'AUDIT',
      message: 'ROI report generated',
      details: 'March campaigns: +42% ROAS',
      timestamp: '1h ago',
    },
    {
      id: '5',
      type: 'success',
      agent: 'BRAIN',
      message: 'Pattern match found',
      details: 'Similar to ASOT 2024 spike (Thu-Sat)',
      timestamp: '2h ago',
    },
  ]);

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} weight="fill" className="text-cyber-green" />;
      case 'pending':
        return <Clock size={16} weight="fill" className="text-cyber-yellow animate-pulse" />;
      case 'error':
        return <XCircle size={16} weight="fill" className="text-cyber-red" />;
    }
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

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`cyber-card p-3 fade-in-up stagger-${Math.min(index + 1, 6)}`}
          >
            {/* Agent Badge + Status */}
            <div className="flex items-center gap-2 mb-2">
              <span className="cyber-badge cyber-badge-info text-[10px] px-2 py-0.5">
                {activity.agent}
              </span>
              {getIcon(activity.type)}
            </div>

            {/* Message */}
            <p className="text-sm text-cyber-text-primary font-medium mb-1">
              {activity.message}
            </p>

            {/* Details */}
            {activity.details && (
              <p className="text-xs text-cyber-text-secondary font-mono leading-relaxed">
                {activity.details}
              </p>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-cyber-border">
              <span className="text-[10px] text-cyber-text-dim font-mono">
                {activity.timestamp}
              </span>
              <ArrowRight size={12} className="text-cyber-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-cyber-border">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-cyber-green">8</div>
            <div className="text-[10px] text-cyber-text-dim uppercase tracking-wide">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-cyber-yellow">1</div>
            <div className="text-[10px] text-cyber-text-dim uppercase tracking-wide">Running</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-cyber-cyan">142</div>
            <div className="text-[10px] text-cyber-text-dim uppercase tracking-wide">Today</div>
          </div>
        </div>
      </div>
    </div>
  );
}
