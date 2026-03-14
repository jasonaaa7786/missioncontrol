import { useState, useEffect, useCallback } from 'react';
import { projects, agents, schedules, tasksV2, activity as activityAPI, system } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import CostTrendChart from '../components/charts/CostTrendChart';
// SubscriberGrowthChart removed — replaced by CostTrendChart
import {
  ChartLine,
  TrendUp,
  Users,
  Calendar,
  CheckCircle,
  Queue,
  Lightning,
  FileText,
  ChatCircle,
  ArrowRight,
  WarningCircle,
  CurrencyDollar,
  Coin,
  ChartBar,
  ShieldWarning
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
  const [costData, setCostData] = useState<{
    today: number;
    sevenDay: number;
    thirtyDay: number;
    allTime: number;
    projected: number;
    totalTokens: number;
    byModel: { model: string; tokens: number; cost: number; calls: number }[];
    byAgent: { agent: string; tokens: number; cost: number; calls: number }[];
    dailyTrend: { date: string; cost: number; tokens: number }[];
  } | null>(null);
  const [alerts, setAlerts] = useState<Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    agentId?: string;
    timestamp: string;
  }>>([]);
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
          system.costs(),
          system.alerts(),
        ]);

        const [projectsResult, agentsResult, schedulesResult, tasksResult, activityResult, costsResult, alertsResult] = results;

        // Extract data safely from settled promises
        const projectsData = projectsResult.status === 'fulfilled' ? projectsResult.value : [];
        const agentsData = agentsResult.status === 'fulfilled' ? agentsResult.value : [];
        const schedulesData = schedulesResult.status === 'fulfilled' ? schedulesResult.value : [];
        const tasksData = tasksResult.status === 'fulfilled' ? tasksResult.value : [];
        const activityData = activityResult.status === 'fulfilled' ? activityResult.value : [];
        const costsDataResult = costsResult.status === 'fulfilled' ? costsResult.value : null;
        const alertsDataResult = alertsResult.status === 'fulfilled' ? alertsResult.value : [];

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
        if (costsDataResult) setCostData(costsDataResult);
        setAlerts(alertsDataResult);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load dashboard data. Retrying...');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 60 seconds (WebSocket handles live updates)
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // Real-time updates via WebSocket
  const reloadDashboard = useCallback(() => {
    // Debounce: ignore if already loading
    const fetchQuiet = async () => {
      try {
        const results = await Promise.allSettled([
          projects.list(),
          agents.list(),
          tasksV2.list(),
          activityAPI.feed({ limit: 3 }),
          system.alerts(),
        ]);
        const [pr, ag, tk, ac, al] = results;
        const p = pr.status === 'fulfilled' ? pr.value : [];
        const a = ag.status === 'fulfilled' ? ag.value : [];
        const t = tk.status === 'fulfilled' ? tk.value : [];
        setStats({
          projects: p.filter((x: any) => x.status === 'active').length,
          tasksInQueue: t.filter((x: any) => x.status !== 'done').length,
          activeAgents: a.filter((x: any) => x.isActive).length,
          schedules: stats.schedules,
        });
        setAgentsList(a);
        if (ac.status === 'fulfilled') setBriefingItems(ac.value);
        if (al.status === 'fulfilled') setAlerts(al.value);
      } catch {}
    };
    fetchQuiet();
  }, [stats.schedules]);

  useWebSocket({
    onEvent: {
      task_created: reloadDashboard,
      task_status_changed: reloadDashboard,
      task_updated: reloadDashboard,
      task_deleted: reloadDashboard,
      agent_updated: reloadDashboard,
      agent_toggled: reloadDashboard,
    },
  });

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
    <div className="space-y-3">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="cyber-heading text-xl sm:text-2xl lg:text-3xl font-bold mb-0.5">LIVESCAPE MISSION CONTROL</h1>
        <p className="text-cyber-text-secondary text-xs font-body">
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
      <div className="cyber-card cyber-glow p-3 fade-in-up stagger-1">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-sm font-bold text-cyber-cyan mb-1.5 uppercase tracking-wide">
              Today's Intelligence Briefing
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
            <div className="text-2xl font-mono font-bold text-cyber-cyan">{day}</div>
            <div className="text-sm text-cyber-text-dim uppercase tracking-wide">{month} {year}</div>
            <div className="text-xs text-cyber-text-dim font-mono mt-1">{timeStr}</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <MetricCard
          icon={<ChartLine size={22} />}
          label="Active Projects"
          value={loading ? '-' : stats.projects.toString()}
          sublabel="Mission folders"
          color="from-cyber-cyan to-blue-600"
          delay={2}
        />
        <MetricCard
          icon={<Queue size={22} />}
          label="Tasks in Queue"
          value={loading ? '-' : stats.tasksInQueue.toString()}
          sublabel="Pending work items"
          color="from-cyber-purple to-purple-600"
          delay={3}
        />
        <MetricCard
          icon={<Users size={22} />}
          label="Agent Swarm"
          value={loading ? '-' : stats.activeAgents.toString()}
          sublabel="Online & ready"
          color="from-cyber-green to-green-600"
          delay={4}
        />
        <MetricCard
          icon={<Calendar size={22} />}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2 fade-in-up stagger-6">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`cyber-card p-3 flex items-center gap-3 border-l-4 ${
                alert.severity === 'critical'
                  ? 'border-l-cyber-red bg-cyber-red/5'
                  : alert.severity === 'warning'
                  ? 'border-l-cyber-yellow bg-cyber-yellow/5'
                  : 'border-l-cyber-cyan bg-cyber-cyan/5'
              }`}
            >
              <ShieldWarning
                size={18}
                weight="fill"
                className={
                  alert.severity === 'critical'
                    ? 'text-cyber-red'
                    : alert.severity === 'warning'
                    ? 'text-cyber-yellow'
                    : 'text-cyber-cyan'
                }
              />
              <span className="text-sm text-cyber-text-primary flex-1">{alert.message}</span>
              <span className="text-[10px] text-cyber-text-dim font-mono uppercase">
                {alert.severity}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cost Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 fade-in-up stagger-7">
        <CostCard
          label="Today's Spend"
          value={costData ? `$${costData.today.toFixed(2)}` : '-'}
          icon={<CurrencyDollar size={24} />}
          loading={loading}
        />
        <CostCard
          label="7-Day Spend"
          value={costData ? `$${costData.sevenDay.toFixed(2)}` : '-'}
          icon={<ChartBar size={24} />}
          loading={loading}
        />
        <CostCard
          label="All-Time Spend"
          value={costData ? `$${costData.allTime.toFixed(2)}` : '-'}
          icon={<Coin size={24} />}
          loading={loading}
        />
        <CostCard
          label="Projected / Mo"
          value={costData ? `$${costData.projected.toFixed(2)}` : '-'}
          icon={<TrendUp size={24} />}
          loading={loading}
          sublabel={costData ? `${costData.totalTokens.toLocaleString()} total tokens` : undefined}
        />
      </div>

      {/* Cost Chart + Model Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="fade-in-up stagger-8">
          {loading || !costData ? (
            <Card className="cyber-card">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[260px] w-full" />
              </CardContent>
            </Card>
          ) : (
            <CostTrendChart
              data={costData.dailyTrend}
              title="Cost Trend (7 Days)"
              description="Daily API spend"
            />
          )}
        </div>

        <Card className="cyber-card fade-in-up stagger-8">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Spend Breakdown</CardTitle>
            <CardDescription>By model & agent</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !costData ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* By Model */}
                {costData.byModel.length > 0 && (
                  <div>
                    <h4 className="text-xs text-cyber-text-dim uppercase tracking-wider mb-2 font-heading">By Model</h4>
                    <div className="space-y-2">
                      {costData.byModel.slice(0, 4).map((m) => (
                        <div key={m.model} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyber-cyan" />
                            <span className="text-cyber-text-primary font-mono text-xs">
                              {m.model.replace('claude-', '').replace('-20250514', '')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-cyber-text-dim text-xs font-mono">
                              {m.tokens.toLocaleString()} tok
                            </span>
                            <span className="text-cyber-cyan font-mono font-bold text-xs">
                              ${m.cost.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {costData.byModel.length > 0 && costData.byAgent.length > 0 && (
                  <div className="border-t border-cyber-border" />
                )}

                {/* By Agent */}
                {costData.byAgent.length > 0 && (
                  <div>
                    <h4 className="text-xs text-cyber-text-dim uppercase tracking-wider mb-2 font-heading">By Agent</h4>
                    <div className="space-y-2">
                      {costData.byAgent.slice(0, 6).map((a) => (
                        <div key={a.agent} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="cyber-badge cyber-badge-info text-[9px] px-1.5 py-0.5">
                              {a.agent}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-cyber-text-dim text-xs font-mono">
                              {a.calls} runs
                            </span>
                            <span className="text-cyber-green font-mono font-bold text-xs">
                              ${a.cost.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {costData.byModel.length === 0 && costData.byAgent.length === 0 && (
                  <div className="text-center py-8">
                    <CurrencyDollar size={32} className="text-cyber-text-dim mx-auto mb-2" />
                    <p className="text-sm text-cyber-text-dim">No usage data yet</p>
                    <p className="text-xs text-cyber-text-dim mt-1">
                      Agent activity will appear here once agents run
                    </p>
                  </div>
                )}
              </div>
            )}
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
    <div className={`cyber-card cyber-glow-hover p-3 fade-in-up stagger-${delay}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${color} bg-opacity-20`}>
          <div className="text-cyber-cyan">
            {icon}
          </div>
        </div>
        <div className="text-2xl font-mono font-bold text-cyber-cyan">
          {value}
        </div>
      </div>
      <p className="text-xs text-cyber-text-primary uppercase tracking-wide font-heading mb-0.5">
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
    <div className="cyber-card p-3">
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

function CostCard({ label, value, icon, loading, sublabel }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading: boolean;
  sublabel?: string;
}) {
  return (
    <div className="cyber-card p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="text-cyber-cyan opacity-60">{icon}</div>
        <span className="text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-6 w-20" />
      ) : (
        <>
          <div className="text-lg font-mono font-bold text-cyber-cyan">{value}</div>
          {sublabel && (
            <p className="text-[10px] text-cyber-text-dim font-mono mt-1">{sublabel}</p>
          )}
        </>
      )}
    </div>
  );
}
