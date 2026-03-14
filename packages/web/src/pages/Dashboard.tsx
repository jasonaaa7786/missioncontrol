import { useState, useEffect, useCallback } from 'react';
import { projects, agents, schedules, tasksV2, activity as activityAPI, system } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ShieldWarning,
  Circle,
  Users,
  Folder,
  Queue,
  Timer,
  Play,
  Pause,
} from '@phosphor-icons/react';
import { Skeleton } from '../components/ui/skeleton';

interface Agent {
  id: string;
  name: string;
  agentId: string;
  isActive: boolean;
  model?: string;
  lastActiveAt?: string;
  workDir?: string;
}

interface Schedule {
  id: string;
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  agentId?: string;
  model?: string;
}

const CHART_COLORS = ['#00d9ff', '#a855f7', '#00ff88', '#ffd700', '#ff3366', '#f97316'];

export default function Dashboard() {
  const [stats, setStats] = useState({ projects: 0, tasksInQueue: 0, activeAgents: 0, totalAgents: 0, schedules: 0 });
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [schedulesList, setSchedulesList] = useState<Schedule[]>([]);
  const [costData, setCostData] = useState<{
    today: number; sevenDay: number; thirtyDay: number; allTime: number;
    projected: number; totalTokens: number;
    byModel: { model: string; tokens: number; cost: number; calls: number }[];
    byAgent: { agent: string; tokens: number; cost: number; calls: number }[];
    dailyTrend: { date: string; cost: number; tokens: number }[];
  } | null>(null);
  const [alerts, setAlerts] = useState<Array<{ type: string; severity: 'critical' | 'warning' | 'info'; message: string; agentId?: string; timestamp: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const results = await Promise.allSettled([
          projects.list(), agents.list(), schedules.list(),
          tasksV2.list(), system.costs(), system.alerts(),
        ]);
        const [pr, ag, sc, tk, co, al] = results;
        const p = pr.status === 'fulfilled' ? pr.value : [];
        const a = ag.status === 'fulfilled' ? ag.value : [];
        const s = sc.status === 'fulfilled' ? sc.value : [];
        const t = tk.status === 'fulfilled' ? tk.value : [];

        setStats({
          projects: p.filter((x: any) => x.status === 'active').length,
          tasksInQueue: t.filter((x: any) => x.status !== 'done').length,
          activeAgents: a.filter((x: any) => x.isActive).length,
          totalAgents: a.length,
          schedules: s.filter((x: any) => x.enabled).length,
        });
        setAgentsList(a);
        setSchedulesList(s);
        if (co.status === 'fulfilled') setCostData(co.value);
        if (al.status === 'fulfilled') setAlerts(al.value);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const reloadDashboard = useCallback(() => {
    const fetchQuiet = async () => {
      try {
        const results = await Promise.allSettled([
          projects.list(), agents.list(), tasksV2.list(), system.alerts(),
        ]);
        const [pr, ag, tk, al] = results;
        const p = pr.status === 'fulfilled' ? pr.value : [];
        const a = ag.status === 'fulfilled' ? ag.value : [];
        const t = tk.status === 'fulfilled' ? tk.value : [];
        setStats(prev => ({
          ...prev,
          projects: p.filter((x: any) => x.status === 'active').length,
          tasksInQueue: t.filter((x: any) => x.status !== 'done').length,
          activeAgents: a.filter((x: any) => x.isActive).length,
          totalAgents: a.length,
        }));
        setAgentsList(a);
        if (al.status === 'fulfilled') setAlerts(al.value);
      } catch {}
    };
    fetchQuiet();
  }, []);

  useWebSocket({
    onEvent: {
      task_created: reloadDashboard, task_status_changed: reloadDashboard,
      task_updated: reloadDashboard, task_deleted: reloadDashboard,
      agent_updated: reloadDashboard, agent_toggled: reloadDashboard,
    },
  });

  // Format chart data
  const trendData = costData?.dailyTrend.map(d => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })) || [];

  const modelChartData = costData?.byModel.slice(0, 5).map(m => ({
    name: m.model.replace('claude-', '').replace(/-20\d{6}/, '').substring(0, 14),
    cost: Number(m.cost.toFixed(4)),
    calls: m.calls,
  })) || [];

  const agentChartData = costData?.byAgent.slice(0, 6).map(a => ({
    name: a.agent.replace('livescape-', '').substring(0, 8).toUpperCase(),
    runs: a.calls,
    cost: Number(a.cost.toFixed(4)),
  })) || [];

  const pieData = costData?.byModel.map((m, i) => ({
    name: m.model.replace('claude-', '').replace(/-20\d{6}/, ''),
    value: Number(m.cost.toFixed(4)),
    color: CHART_COLORS[i % CHART_COLORS.length],
  })) || [];

  // Time ago helper
  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 w-24 rounded-full" />)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">

      {/* ── Section 1: Status Pills ── */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill icon={<Circle size={8} weight="fill" className="text-cyber-green" />} label="Online" />
        <StatusPill icon={<Users size={12} />} label={`${stats.activeAgents}/${stats.totalAgents} Agents`} />
        <StatusPill icon={<Queue size={12} />} label={`${stats.tasksInQueue} Queued`} />
        <StatusPill icon={<Folder size={12} />} label={`${stats.projects} Projects`} />
        <StatusPill icon={<Timer size={12} />} label={`${stats.schedules} Heartbeats`} />
        <div className="ml-auto text-[10px] text-cyber-text-dim font-mono">
          Last updated: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* ── Alert Banner ── */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {alerts.slice(0, 3).map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-mono ${
                alert.severity === 'critical' ? 'bg-cyber-red/10 text-cyber-red border border-cyber-red/20' :
                alert.severity === 'warning' ? 'bg-cyber-yellow/10 text-cyber-yellow border border-cyber-yellow/20' :
                'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20'
              }`}
            >
              <ShieldWarning size={12} weight="fill" />
              {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* ── Section 2: Cost Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <CostCard label="Today's Cost" value={costData ? `$${costData.today.toFixed(2)}` : '$0'} sub={costData ? `${costData.totalTokens > 0 ? Math.round(costData.totalTokens * (costData.today / (costData.allTime || 1))).toLocaleString() : '0'} tokens` : ''} />
        <CostCard label="All-Time Cost" value={costData ? `$${costData.allTime.toFixed(2)}` : '$0'} sub={costData ? `${costData.totalTokens.toLocaleString()} total tokens` : ''} />
        <CostCard label="Projected Monthly" value={costData ? `$${costData.projected.toFixed(0)}` : '$0'} sub="Based on 30-day avg" />

        {/* Cost Breakdown — mini pie */}
        <div className="cyber-card p-3">
          <p className="text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading">Cost Breakdown</p>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-16 h-16 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={30} paddingAngle={2} strokeWidth={0}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                {pieData.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[9px]">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-cyber-text-dim truncate">{d.name}</span>
                    <span className="ml-auto text-cyber-text-primary font-mono">${d.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-cyber-text-dim mt-2">No data</p>
          )}
        </div>
      </div>

      {/* ── Section 3: Charts & Trends ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-[10px] text-cyber-text-dim uppercase tracking-widest font-heading">Charts & Trends</h2>
          <span className="text-[10px] text-cyber-text-dim font-mono">7 Days</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Chart 1: Daily Cost Trend */}
          <div className="cyber-card p-3">
            <p className="text-[11px] text-cyber-text-primary font-heading uppercase tracking-wide mb-2">Daily Cost Trend</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00d9ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#475569" fontSize={9} fontFamily="JetBrains Mono" tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} fontFamily="JetBrains Mono" tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#e2e8f0', fontFamily: 'JetBrains Mono', fontSize: '10px' }} formatter={(v: any) => [`$${Number(v).toFixed(4)}`, 'Cost']} labelStyle={{ color: '#00d9ff', fontWeight: 600, fontSize: '10px' }} />
                <Area type="monotone" dataKey="cost" stroke="#00d9ff" strokeWidth={2} fill="url(#costGrad)" dot={{ fill: '#00d9ff', r: 2, strokeWidth: 0 }} activeDot={{ r: 4, fill: '#00d9ff', stroke: '#0f172a', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Cost by Model */}
          <div className="cyber-card p-3">
            <p className="text-[11px] text-cyber-text-primary font-heading uppercase tracking-wide mb-2">Cost by Model</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={modelChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" fontSize={8} fontFamily="JetBrains Mono" tickLine={false} angle={-20} textAnchor="end" height={35} />
                <YAxis stroke="#475569" fontSize={9} fontFamily="JetBrains Mono" tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#e2e8f0', fontFamily: 'JetBrains Mono', fontSize: '10px' }} formatter={(v: any) => [`$${Number(v).toFixed(4)}`, 'Cost']} labelStyle={{ color: '#a855f7', fontWeight: 600, fontSize: '10px' }} />
                <Bar dataKey="cost" radius={[3, 3, 0, 0]}>
                  {modelChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Agent Activity */}
          <div className="cyber-card p-3">
            <p className="text-[11px] text-cyber-text-primary font-heading uppercase tracking-wide mb-2">Agent Activity</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={agentChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#475569" fontSize={8} fontFamily="JetBrains Mono" tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} fontFamily="JetBrains Mono" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', color: '#e2e8f0', fontFamily: 'JetBrains Mono', fontSize: '10px' }} />
                <Legend wrapperStyle={{ fontSize: '9px', fontFamily: 'JetBrains Mono' }} />
                <Bar dataKey="runs" name="Runs" fill="#00d9ff" radius={[2, 2, 0, 0]} />
                <Bar dataKey="cost" name="Cost" fill="#a855f7" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Section 4: Schedules / Cron Jobs ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-[10px] text-cyber-text-dim uppercase tracking-widest font-heading">Cron Jobs</h2>
          <span className="text-[10px] text-cyber-text-dim font-mono">{schedulesList.length} total</span>
        </div>
        <div className="cyber-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-cyber-border text-cyber-text-dim">
                <th className="text-left py-2 px-3 font-heading text-[10px] uppercase tracking-wider w-8">#</th>
                <th className="text-left py-2 px-3 font-heading text-[10px] uppercase tracking-wider">Name</th>
                <th className="text-left py-2 px-3 font-heading text-[10px] uppercase tracking-wider hidden sm:table-cell">Schedule</th>
                <th className="text-left py-2 px-3 font-heading text-[10px] uppercase tracking-wider hidden md:table-cell">Last Run</th>
                <th className="text-left py-2 px-3 font-heading text-[10px] uppercase tracking-wider hidden lg:table-cell">Agent</th>
                <th className="text-right py-2 px-3 font-heading text-[10px] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedulesList.length > 0 ? schedulesList.map((s, i) => (
                <tr key={s.id} className="border-b border-cyber-border/50 hover:bg-cyber-bg-tertiary/30 transition-colors">
                  <td className="py-1.5 px-3 text-cyber-text-dim font-mono">{i + 1}</td>
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.enabled ? 'bg-cyber-green' : 'bg-cyber-text-dim'}`} />
                      <span className="text-cyber-text-primary">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5 px-3 font-mono text-cyber-text-dim hidden sm:table-cell">{s.cronExpression || '—'}</td>
                  <td className="py-1.5 px-3 font-mono text-cyber-text-dim hidden md:table-cell">
                    {s.lastRun ? new Date(s.lastRun).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-1.5 px-3 hidden lg:table-cell">
                    {s.agentId ? (
                      <span className="cyber-badge cyber-badge-info text-[9px] px-1.5 py-0.5">{s.agentId.replace('livescape-', '').toUpperCase()}</span>
                    ) : '—'}
                  </td>
                  <td className="py-1.5 px-3 text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${s.enabled ? 'text-cyber-green' : 'text-cyber-text-dim'}`}>
                      {s.enabled ? <Play size={10} weight="fill" /> : <Pause size={10} />}
                      {s.enabled ? 'active' : 'paused'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="py-4 px-3 text-center text-cyber-text-dim">
                    No scheduled jobs configured
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 5: Agent Status ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-[10px] text-cyber-text-dim uppercase tracking-widest font-heading">Active Agents</h2>
          <span className="text-[10px] text-cyber-text-dim font-mono">{stats.activeAgents} online, {stats.totalAgents} total</span>
        </div>
        <div className="cyber-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-cyber-border text-cyber-text-dim">
                <th className="text-left py-2 px-3 font-heading text-[10px] uppercase tracking-wider">Agent</th>
                <th className="text-left py-2 px-3 font-heading text-[10px] uppercase tracking-wider hidden sm:table-cell">ID</th>
                <th className="text-left py-2 px-3 font-heading text-[10px] uppercase tracking-wider hidden md:table-cell">Model</th>
                <th className="text-left py-2 px-3 font-heading text-[10px] uppercase tracking-wider hidden lg:table-cell">Last Active</th>
                <th className="text-right py-2 px-3 font-heading text-[10px] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {agentsList.map((agent) => (
                <tr key={agent.id} className="border-b border-cyber-border/50 hover:bg-cyber-bg-tertiary/30 transition-colors">
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${agent.isActive ? 'bg-cyber-green animate-pulse' : 'bg-cyber-text-dim'}`} />
                      <span className="cyber-badge cyber-badge-info text-[9px] px-1.5 py-0.5">
                        {agent.name.replace('livescape-', '').toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 px-3 font-mono text-cyber-text-dim text-[10px] hidden sm:table-cell">{agent.agentId || agent.name}</td>
                  <td className="py-1.5 px-3 font-mono text-cyber-text-dim text-[10px] hidden md:table-cell">
                    {agent.model?.replace('claude-', '').replace(/-20\d{6}/, '') || '—'}
                  </td>
                  <td className="py-1.5 px-3 font-mono text-cyber-text-dim text-[10px] hidden lg:table-cell">
                    {timeAgo(agent.lastActiveAt)}
                  </td>
                  <td className="py-1.5 px-3 text-right">
                    <span className={`text-[10px] font-mono ${agent.isActive ? 'text-cyber-green' : 'text-cyber-text-dim'}`}>
                      {agent.isActive ? 'online' : 'offline'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Compact Sub-Components ── */

function StatusPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyber-bg-secondary border border-cyber-border rounded-full text-[11px] text-cyber-text-primary font-mono">
      {icon}
      {label}
    </div>
  );
}

function CostCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="cyber-card p-3">
      <p className="text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading">{label}</p>
      <p className="text-xl font-bold text-cyber-text-primary font-mono mt-1">{value}</p>
      {sub && <p className="text-[10px] text-cyber-text-dim font-mono mt-0.5">{sub}</p>}
    </div>
  );
}
