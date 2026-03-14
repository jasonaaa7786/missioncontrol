import { useState, useEffect } from 'react';
import { system, agents as agentsAPI, tasksV2, projects as projectsAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import CostTrendChart from '../components/charts/CostTrendChart';
import {
  DownloadSimple,
  ChartBar,
  CheckCircle,
  Lightning,
  CurrencyDollar,
  Robot,
  ListChecks,
  FolderOpen,
} from '@phosphor-icons/react';

interface ReportData {
  costs: {
    today: number;
    sevenDay: number;
    thirtyDay: number;
    allTime: number;
    projected: number;
    totalTokens: number;
    byModel: { model: string; tokens: number; cost: number; calls: number }[];
    byAgent: { agent: string; tokens: number; cost: number; calls: number }[];
    dailyTrend: { date: string; cost: number; tokens: number }[];
  } | null;
  agents: any[];
  tasks: any[];
  projects: any[];
}

export default function Reports() {
  const [data, setData] = useState<ReportData>({
    costs: null,
    agents: [],
    tasks: [],
    projects: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const [costsData, agentsData, tasksData, projectsData] = await Promise.allSettled([
        system.costs(),
        agentsAPI.list(),
        tasksV2.list(),
        projectsAPI.list(),
      ]);

      setData({
        costs: costsData.status === 'fulfilled' ? costsData.value : null,
        agents: agentsData.status === 'fulfilled' ? agentsData.value : [],
        tasks: tasksData.status === 'fulfilled' ? tasksData.value : [],
        projects: projectsData.status === 'fulfilled' ? projectsData.value : [],
      });
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Computed stats
  const totalTasks = data.tasks.length;
  const doneTasks = data.tasks.filter((t: any) => t.status === 'done').length;
  const activeTasks = data.tasks.filter((t: any) => t.status === 'active').length;
  const blockedTasks = data.tasks.filter((t: any) => t.status === 'blocked').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const activeAgents = data.agents.filter((a: any) => a.isActive).length;
  const totalAgents = data.agents.length;

  const activeProjects = data.projects.filter((p: any) => p.status === 'active').length;

  // Task status distribution
  const statusCounts: Record<string, number> = {};
  data.tasks.forEach((t: any) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });

  // Priority distribution
  const priorityCounts: Record<string, number> = {};
  data.tasks.forEach((t: any) => {
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
  });

  // CSV Export
  const exportTasksCSV = () => {
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Assigned Agent', 'Project', 'Created', 'Completed'];
    const rows = data.tasks.map((t: any) => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.assignedAgent || '',
      t.project?.name || '',
      new Date(t.createdAt).toISOString().split('T')[0],
      t.completedAt ? new Date(t.completedAt).toISOString().split('T')[0] : '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, 'tasks-report.csv');
  };

  const exportCostCSV = () => {
    if (!data.costs) return;

    const lines: string[] = [];
    lines.push('=== COST SUMMARY ===');
    lines.push(`Today,$${data.costs.today}`);
    lines.push(`7-Day,$${data.costs.sevenDay}`);
    lines.push(`30-Day,$${data.costs.thirtyDay}`);
    lines.push(`All-Time,$${data.costs.allTime}`);
    lines.push(`Projected Monthly,$${data.costs.projected}`);
    lines.push(`Total Tokens,${data.costs.totalTokens}`);
    lines.push('');
    lines.push('=== DAILY TREND ===');
    lines.push('Date,Cost,Tokens');
    data.costs.dailyTrend.forEach(d => {
      lines.push(`${d.date},$${d.cost},${d.tokens}`);
    });
    lines.push('');
    lines.push('=== BY MODEL ===');
    lines.push('Model,Tokens,Cost,Calls');
    data.costs.byModel.forEach(m => {
      lines.push(`${m.model},${m.tokens},$${m.cost},${m.calls}`);
    });
    lines.push('');
    lines.push('=== BY AGENT ===');
    lines.push('Agent,Tokens,Cost,Calls');
    data.costs.byAgent.forEach(a => {
      lines.push(`${a.agent},${a.tokens},$${a.cost},${a.calls}`);
    });

    downloadCSV(lines.join('\n'), 'cost-report.csv');
  };

  const exportAgentCSV = () => {
    const headers = ['ID', 'Name', 'Status', 'Model', 'Run Count', 'Success Rate', 'Total Tokens', 'Total Cost'];
    const rows = data.agents.map((a: any) => [
      a.id,
      `"${a.name}"`,
      a.isActive ? 'Active' : 'Inactive',
      a.model || '',
      a.runCount || 0,
      `${a.successRate || 0}%`,
      a.totalTokens || 0,
      `$${(a.totalCost || 0).toFixed(4)}`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, 'agents-report.csv');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 fade-in-up">
        <div>
          <h1 className="cyber-heading text-2xl sm:text-4xl font-bold mb-2">MISSION REPORTS</h1>
          <p className="text-cyber-text-secondary font-body">
            Performance analytics & data export
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportTasksCSV}
            className="cyber-btn px-3 py-2 text-xs font-heading uppercase tracking-wide flex items-center gap-1.5"
          >
            <DownloadSimple size={14} />
            Tasks CSV
          </button>
          <button
            onClick={exportCostCSV}
            disabled={!data.costs}
            className="px-3 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-xs text-cyber-text-primary hover:border-cyber-cyan transition-colors disabled:opacity-50 font-heading uppercase tracking-wide flex items-center gap-1.5"
          >
            <DownloadSimple size={14} />
            Cost CSV
          </button>
          <button
            onClick={exportAgentCSV}
            className="px-3 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-xs text-cyber-text-primary hover:border-cyber-cyan transition-colors font-heading uppercase tracking-wide flex items-center gap-1.5"
          >
            <DownloadSimple size={14} />
            Agents CSV
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 fade-in-up stagger-1">
        <StatCard
          icon={<ListChecks size={24} />}
          label="Task Completion"
          value={loading ? '-' : `${completionRate}%`}
          sub={`${doneTasks} of ${totalTasks} done`}
          color="text-cyber-green"
        />
        <StatCard
          icon={<Lightning size={24} />}
          label="Active Tasks"
          value={loading ? '-' : activeTasks.toString()}
          sub={blockedTasks > 0 ? `${blockedTasks} blocked` : 'None blocked'}
          color="text-cyber-yellow"
        />
        <StatCard
          icon={<Robot size={24} />}
          label="Agent Fleet"
          value={loading ? '-' : `${activeAgents}/${totalAgents}`}
          sub="Active agents"
          color="text-cyber-cyan"
        />
        <StatCard
          icon={<FolderOpen size={24} />}
          label="Active Projects"
          value={loading ? '-' : activeProjects.toString()}
          sub={`${data.projects.length} total`}
          color="text-cyber-purple"
        />
      </div>

      {/* Cost Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="fade-in-up stagger-2">
          {loading || !data.costs ? (
            <Card className="cyber-card">
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-[260px] w-full" /></CardContent>
            </Card>
          ) : (
            <CostTrendChart
              data={data.costs.dailyTrend}
              title="Cost Trend (7 Days)"
              description="Daily API spend"
            />
          )}
        </div>

        {/* Task Status Breakdown */}
        <Card className="cyber-card fade-in-up stagger-2">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Task Distribution</CardTitle>
            <CardDescription>By status and priority</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : (
              <div className="space-y-6">
                {/* By Status */}
                <div>
                  <h4 className="text-xs text-cyber-text-dim uppercase tracking-wider font-heading mb-3">By Status</h4>
                  <div className="space-y-2">
                    {Object.entries(statusCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-xs text-cyber-text-secondary font-mono uppercase">{status}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-cyber-bg-tertiary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyber-cyan/60 rounded-full"
                                style={{ width: `${(count / totalTasks) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-cyber-text-primary font-mono w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* By Priority */}
                <div>
                  <h4 className="text-xs text-cyber-text-dim uppercase tracking-wider font-heading mb-3">By Priority</h4>
                  <div className="space-y-2">
                    {['urgent', 'high', 'normal', 'low'].map(priority => {
                      const count = priorityCounts[priority] || 0;
                      const color = priority === 'urgent' ? 'bg-cyber-red/60' :
                                   priority === 'high' ? 'bg-cyber-yellow/60' :
                                   priority === 'normal' ? 'bg-cyber-cyan/60' : 'bg-cyber-text-dim/40';
                      return (
                        <div key={priority} className="flex items-center justify-between">
                          <span className="text-xs text-cyber-text-secondary font-mono uppercase">{priority}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-cyber-bg-tertiary rounded-full overflow-hidden">
                              <div
                                className={`h-full ${color} rounded-full`}
                                style={{ width: totalTasks > 0 ? `${(count / totalTasks) * 100}%` : '0%' }}
                              />
                            </div>
                            <span className="text-xs text-cyber-text-primary font-mono w-8 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost & Agent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Model */}
        <Card className="cyber-card fade-in-up stagger-3">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <CurrencyDollar size={20} className="text-cyber-cyan" />
              Spend by Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !data.costs ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : data.costs.byModel.length > 0 ? (
              <div className="space-y-3">
                {data.costs.byModel.map((m) => (
                  <div key={m.model} className="flex items-center justify-between py-2 border-b border-cyber-border/30 last:border-0">
                    <div>
                      <p className="text-sm text-cyber-text-primary font-mono">
                        {m.model.replace('claude-', '').replace('-20250514', '')}
                      </p>
                      <p className="text-[10px] text-cyber-text-dim">
                        {m.tokens.toLocaleString()} tokens • {m.calls} calls
                      </p>
                    </div>
                    <span className="text-sm text-cyber-cyan font-mono font-bold">${m.cost.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-cyber-text-dim">No cost data available</p>
            )}
          </CardContent>
        </Card>

        {/* Cost by Agent */}
        <Card className="cyber-card fade-in-up stagger-3">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <ChartBar size={20} className="text-cyber-green" />
              Spend by Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading || !data.costs ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : data.costs.byAgent.length > 0 ? (
              <div className="space-y-3">
                {data.costs.byAgent.map((a) => (
                  <div key={a.agent} className="flex items-center justify-between py-2 border-b border-cyber-border/30 last:border-0">
                    <div>
                      <p className="text-sm text-cyber-text-primary font-mono">{a.agent}</p>
                      <p className="text-[10px] text-cyber-text-dim">
                        {a.tokens.toLocaleString()} tokens • {a.calls} calls
                      </p>
                    </div>
                    <span className="text-sm text-cyber-green font-mono font-bold">${a.cost.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-cyber-text-dim">No agent cost data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card className="cyber-card fade-in-up stagger-4">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Agent Performance</CardTitle>
          <CardDescription>Run counts, success rates, and resource usage</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyber-border text-left">
                    <th className="px-4 py-2 text-[10px] text-cyber-text-dim uppercase font-heading">Agent</th>
                    <th className="px-4 py-2 text-[10px] text-cyber-text-dim uppercase font-heading text-center">Status</th>
                    <th className="px-4 py-2 text-[10px] text-cyber-text-dim uppercase font-heading text-right">Runs</th>
                    <th className="px-4 py-2 text-[10px] text-cyber-text-dim uppercase font-heading text-right">Success</th>
                    <th className="px-4 py-2 text-[10px] text-cyber-text-dim uppercase font-heading text-right">Tokens</th>
                    <th className="px-4 py-2 text-[10px] text-cyber-text-dim uppercase font-heading text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agents
                    .filter((a: any) => a.runCount > 0 || a.totalTokens > 0)
                    .sort((a: any, b: any) => (b.totalCost || 0) - (a.totalCost || 0))
                    .map((agent: any) => (
                      <tr key={agent.id} className="border-b border-cyber-border/30 hover:bg-cyber-bg-tertiary/30">
                        <td className="px-4 py-2">
                          <span className="text-sm text-cyber-text-primary font-mono">
                            {agent.name.replace('livescape-', '').replace('ls-', '').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${
                            agent.isActive ? 'text-cyber-green' : 'text-cyber-text-dim'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              agent.isActive ? 'bg-cyber-green' : 'bg-cyber-text-dim'
                            }`} />
                            {agent.isActive ? 'ON' : 'OFF'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-cyber-text-secondary font-mono">
                          {agent.runCount || 0}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={`text-xs font-mono font-bold ${
                            (agent.successRate || 0) >= 80 ? 'text-cyber-green' :
                            (agent.successRate || 0) >= 50 ? 'text-cyber-yellow' :
                            agent.runCount > 0 ? 'text-cyber-red' : 'text-cyber-text-dim'
                          }`}>
                            {agent.runCount > 0 ? `${agent.successRate || 0}%` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-cyber-text-secondary font-mono">
                          {(agent.totalTokens || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-cyber-cyan font-mono font-bold">
                          ${(agent.totalCost || 0).toFixed(4)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {data.agents.filter((a: any) => a.runCount > 0 || a.totalTokens > 0).length === 0 && (
                <p className="text-sm text-cyber-text-dim text-center py-6">No agent activity data yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <Card className="cyber-card cyber-glow-hover">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`${color}`}>{icon}</div>
        </div>
        <div className="text-2xl sm:text-3xl font-mono font-bold text-cyber-text-primary mb-1">
          {value}
        </div>
        <p className="text-xs text-cyber-text-dim uppercase tracking-wide font-heading">{label}</p>
        <p className="text-[10px] text-cyber-text-dim mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
