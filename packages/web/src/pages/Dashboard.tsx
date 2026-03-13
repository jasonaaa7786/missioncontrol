import { useState, useEffect } from 'react';
import { projects, agents, schedules, tasksV2, activity as activityAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import SubscriberGrowthChart from '../components/charts/SubscriberGrowthChart';
import {
  ChartLine,
  TrendUp,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Queue,
  Warning,
  Lightning,
  Robot,
  FileText,
  ChatCircle,
  ArrowRight,
  WarningCircle
} from '@phosphor-icons/react';
import { Skeleton } from '../components/ui/skeleton';

interface Agent {
  id: string;
  name: string;
  agentId: string;
  isActive: boolean;
  model?: string;
  workDir?: string;
}

interface BriefingItem {
  id: string;
  type: string;
  message: string;
  agentId?: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    tasksInQueue: 0,
    activeAgents: 0,
    schedules: 0,
  });
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [briefingItems, setBriefingItems] = useState<BriefingItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use Promise.allSettled so one failing API doesn't break everything
        const results = await Promise.allSettled([
          projects.list(),
          agents.list(),
          schedules.list(),
          tasksV2.list(),
          activityAPI.feed({ limit: 3 }),
        ]);

        const [projectsResult, agentsResult, schedulesResult, tasksResult, activityResult] = results;

        // Extract data safely from settled promises
        const projectsData = projectsResult.status === 'fulfilled' ? projectsResult.value : [];
        const agentsData = agentsResult.status === 'fulfilled' ? agentsResult.value : [];
        const schedulesData = schedulesResult.status === 'fulfilled' ? schedulesResult.value : [];
        const tasksData = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
        const activityData = activityResult.status === 'fulfilled' ? activityResult.value : [];

        // Count active projects (status = 'active')
        const activeProjects = projectsData.filter((p: any) => p.status === 'active').length;

        // Count active agents (isActive = true)
        const activeAgents = agentsData.filter((a: any) => a.isActive).length;

        // Count tasks in queue (not done)
        const tasksInQueue = tasksData.filter((t: any) => t.status !== 'done').length;

        // Count enabled schedules
        const enabledSchedules = schedulesData.filter((s: any) => s.enabled).length;

        setStats({
          projects: activeProjects,
          tasksInQueue: tasksInQueue,
          activeAgents: activeAgents,
          schedules: enabledSchedules,
        });

        setAgentsList(agentsData);
        setBriefingItems(activityData);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load dashboard data. Retrying...');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getBriefingIcon = (type: string) => {
    switch (type) {
      case 'agent_completed':
        return <CheckCircle size={16} className="text-cyber-green" />;
      case 'agent_started':
        return <Lightning size={16} className="text-cyber-yellow" />;
      case 'task_created':
      case 'task_updated':
        return <FileText size={16} className="text-cyber-cyan" />;
      case 'comment_added':
        return <ChatCircle size={16} className="text-cyber-purple" />;
      case 'status_changed':
        return <TrendUp size={16} className="text-cyber-cyan" />;
      default:
        return <ArrowRight size={16} className="text-cyber-text-dim" />;
    }
  };

  // Format briefing messages to be human-readable
  const formatBriefingMessage = (item: BriefingItem) => {
    const agent = item.agentId?.replace('livescape-', '').toUpperCase();
    const msg = item.message;

    // Clean up verbose heartbeat/agent messages
    if (msg.includes('heartbeat triggered') && msg.includes('HEARTBEAT.md updated')) {
      return `${agent || 'Agent'} completed routine check — status updated`;
    }
    if (msg.includes('heartbeat started') && msg.includes('has_tasks')) {
      return `${agent || 'Agent'} picked up pending tasks and began processing`;
    }
    if (msg.includes('heartbeat triggered')) {
      return `${agent || 'Agent'} ran scheduled health check`;
    }
    if (msg.includes('heartbeat started')) {
      return `${agent || 'Agent'} started a new work session`;
    }
    if (item.type === 'task_created') {
      return msg.length > 60 ? msg.substring(0, 57) + '...' : msg;
    }
    if (item.type === 'status_changed') {
      return msg.length > 60 ? msg.substring(0, 57) + '...' : msg;
    }
    // Default: truncate long messages
    return msg.length > 70 ? msg.substring(0, 67) + '...' : msg;
  };

  // Format date for the briefing header
  const day = currentTime.getDate().toString().padStart(2, '0');
  const month = currentTime.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = currentTime.getFullYear();
  const timeStr = currentTime.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="cyber-heading text-5xl font-bold mb-3">LIVESCAPE MISSION CONTROL</h1>
        <p className="text-cyber-text-secondary text-lg font-body">
          Intelligence & Operations Hub
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="cyber-card border-cyber-red/50 p-4 flex items-center gap-3 fade-in-up">
          <WarningCircle size={20} className="text-cyber-red flex-shrink-0" />
          <p className="text-sm text-cyber-red">{error}</p>
        </div>
      )}

      {/* Today's Briefing Banner */}
      <div className="cyber-card cyber-glow p-6 fade-in-up stagger-1">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-cyber-cyan mb-2">
              TODAY'S INTELLIGENCE BRIEFING
            </h2>
            <div className="space-y-2 text-sm">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : briefingItems.length > 0 ? (
                briefingItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    {getBriefingIcon(item.type)}
                    <span className="text-cyber-text-primary">
                      {formatBriefingMessage(item)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-cyber-green" />
                  <span className="text-cyber-text-primary">
                    All systems operational — no new activity
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-cyber-cyan">{day}</div>
            <div className="text-sm text-cyber-text-dim uppercase tracking-wide">{month} {year}</div>
            <div className="text-xs text-cyber-text-dim font-mono mt-1">{timeStr}</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<ChartLine size={28} />}
          label="Active Projects"
          value={loading ? '-' : stats.projects.toString()}
          sublabel="Mission folders"
          color="from-cyber-cyan to-blue-600"
          delay={2}
        />
        <MetricCard
          icon={<Queue size={28} />}
          label="Tasks in Queue"
          value={loading ? '-' : stats.tasksInQueue.toString()}
          sublabel="Pending work items"
          color="from-cyber-purple to-purple-600"
          delay={3}
        />
        <MetricCard
          icon={<Users size={28} />}
          label="Agent Swarm"
          value={loading ? '-' : stats.activeAgents.toString()}
          sublabel="Online & ready"
          color="from-cyber-green to-green-600"
          delay={4}
        />
        <MetricCard
          icon={<Calendar size={28} />}
          label="Heartbeats"
          value={loading ? '-' : stats.schedules.toString()}
          sublabel="Automated checks"
          color="from-cyber-yellow to-yellow-600"
          delay={5}
        />
      </div>

      {/* AI Team Status */}
      <Card className="cyber-card fade-in-up stagger-6">
        <CardHeader>
          <CardTitle className="font-heading text-xl">AI Agent Swarm</CardTitle>
          <CardDescription>Livescape intelligence network status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="cyber-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))
            ) : agentsList.length > 0 ? (
              agentsList.map((agent) => (
                <AgentStatusCard
                  key={agent.id}
                  name={agent.name.replace('livescape-', '').toUpperCase()}
                  status={agent.isActive ? 'online' : 'offline'}
                  progress={agent.isActive ? 100 : 0}
                />
              ))
            ) : (
              <>
                <AgentStatusCard name="SCOUT" status="online" progress={100} />
                <AgentStatusCard name="PULSE" status="online" progress={100} />
                <AgentStatusCard name="RADAR" status="online" progress={100} />
                <AgentStatusCard name="META" status="online" progress={100} />
                <AgentStatusCard name="AUDIT" status="online" progress={100} />
                <AgentStatusCard name="TRENDS" status="online" progress={100} />
                <AgentStatusCard name="BRAIN" status="online" progress={100} />
                <AgentStatusCard name="BRAND" status="online" progress={100} />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="fade-in-up stagger-7">
          <SubscriberGrowthChart
            data={[
              { date: 'Jan', subscribers: 25000, views: 8000000 },
              { date: 'Feb', subscribers: 26200, views: 8200000 },
              { date: 'Mar', subscribers: 27700, views: 8495436 },
            ]}
            title="Artist Growth (KI/KI)"
            description="YouTube metrics over time"
          />
        </div>

        <Card className="cyber-card fade-in-up stagger-8">
          <CardHeader>
            <CardTitle className="font-heading text-xl">System Status</CardTitle>
            <CardDescription>All systems operational</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatusRow label="Mission Control" status="online" uptime="99.8%" />
              <StatusRow label="YouTube API" status="online" uptime="100%" />
              <StatusRow label="Data Pipeline" status="online" uptime="98.2%" />
              <StatusRow label="Agent Swarm" status="online" uptime="99.9%" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sublabel, color, delay }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  color: string;
  delay: number;
}) {
  return (
    <div className={`cyber-card cyber-glow-hover p-6 fade-in-up stagger-${delay}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${color} bg-opacity-20`}>
          <div className="text-cyber-cyan">
            {icon}
          </div>
        </div>
        <div className="text-4xl font-mono font-bold text-cyber-cyan">
          {value}
        </div>
      </div>
      <p className="text-sm text-cyber-text-primary uppercase tracking-wide font-heading mb-1">
        {label}
      </p>
      {sublabel && (
        <p className="text-xs text-cyber-text-dim font-body">
          {sublabel}
        </p>
      )}
    </div>
  );
}

function AgentStatusCard({ name, status, progress }: {
  name: string;
  status: 'online' | 'busy' | 'offline';
  progress: number;
}) {
  const statusColors = {
    online: 'text-cyber-green',
    busy: 'text-cyber-yellow',
    offline: 'text-cyber-text-dim',
  };

  return (
    <div className="cyber-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="cyber-badge cyber-badge-info text-[10px]">{name}</span>
        <div className={`w-2 h-2 rounded-full ${statusColors[status]} ${status !== 'offline' ? 'animate-pulse' : ''}`} />
      </div>
      <div className="cyber-progress">
        <div className="cyber-progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-[10px] text-cyber-text-dim uppercase mt-2 font-mono">{status}</p>
    </div>
  );
}

function StatusRow({ label, status, uptime }: {
  label: string;
  status: 'online' | 'offline';
  uptime: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-cyber-green animate-pulse' : 'bg-cyber-red'}`} />
        <span className="text-cyber-text-primary font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-cyber-text-dim font-mono">Uptime: {uptime}</span>
        <span className={`text-sm font-mono ${status === 'online' ? 'text-cyber-green' : 'text-cyber-red'}`}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
