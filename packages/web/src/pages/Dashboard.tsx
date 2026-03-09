import { useState, useEffect } from 'react';
import { projects, agents, schedules } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import SubscriberGrowthChart from '../components/charts/SubscriberGrowthChart';
import { 
  ChartLine, 
  TrendUp, 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  Target
} from '@phosphor-icons/react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    agents: 0,
    schedules: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [projectsData, agentsData, schedulesData] = await Promise.all([
          projects.list(),
          agents.list(),
          schedules.list(),
        ]);

        const totalTasks = projectsData.reduce((sum: number, p: any) => sum + (p._count?.tasks || 0), 0);

        setStats({
          projects: projectsData.filter((p: any) => p.status === 'active').length,
          tasks: totalTasks,
          agents: agentsData.filter((a: any) => a.isActive).length,
          schedules: schedulesData.filter((s: any) => s.enabled).length,
        });
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="cyber-heading text-5xl font-bold mb-3">Intelligence Overview</h1>
        <p className="text-cyber-text-secondary text-lg font-body">
          Livescape AI Operations Dashboard
        </p>
      </div>

      {/* Today's Briefing Banner */}
      <div className="cyber-card cyber-glow p-6 fade-in-up stagger-1">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl font-bold text-cyber-cyan mb-2">
              TODAY'S INTELLIGENCE BRIEFING
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-cyber-green" />
                <span className="text-cyber-text-primary">
                  ASOT Vietnam 2026: 72 tickets sold (Mar 9)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-cyber-yellow" />
                <span className="text-cyber-text-primary">
                  Scout brief due: KI/KI artist analysis
                </span>
              </div>
              <div className="flex items-center gap-3">
                <TrendUp size={16} className="text-cyber-cyan" />
                <span className="text-cyber-text-primary">
                  Meta campaigns: 11.99x ROAS (top performer)
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-cyber-cyan">09</div>
            <div className="text-sm text-cyber-text-dim uppercase tracking-wide">MAR 2026</div>
            <div className="text-xs text-cyber-text-dim font-mono mt-1">04:30 UTC</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          icon={<ChartLine size={28} />}
          label="Active Projects" 
          value={loading ? '-' : stats.projects.toString()} 
          color="from-cyber-cyan to-blue-600"
          delay={2}
        />
        <MetricCard 
          icon={<Target size={28} />}
          label="In Progress Tasks" 
          value={loading ? '-' : stats.tasks.toString()} 
          color="from-cyber-purple to-purple-600"
          delay={3}
        />
        <MetricCard 
          icon={<Users size={28} />}
          label="Active Agents" 
          value={loading ? '-' : stats.agents.toString()} 
          color="from-cyber-green to-green-600"
          delay={4}
        />
        <MetricCard 
          icon={<Calendar size={28} />}
          label="Scheduled Jobs" 
          value={loading ? '-' : stats.schedules.toString()} 
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
            <AgentStatusCard name="SCOUT" status="online" progress={100} />
            <AgentStatusCard name="PULSE" status="online" progress={100} />
            <AgentStatusCard name="RADAR" status="online" progress={100} />
            <AgentStatusCard name="META" status="online" progress={100} />
            <AgentStatusCard name="AUDIT" status="online" progress={100} />
            <AgentStatusCard name="TRENDS" status="online" progress={100} />
            <AgentStatusCard name="BRAIN" status="online" progress={100} />
            <AgentStatusCard name="BRAND" status="online" progress={100} />
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

function MetricCard({ icon, label, value, color, delay }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
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
      <p className="text-sm text-cyber-text-dim uppercase tracking-wide font-heading">
        {label}
      </p>
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
