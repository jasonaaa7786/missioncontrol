import { useState, useEffect, useCallback } from 'react';
import { useAgents } from '../hooks/useAgents';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../contexts/AuthContext';
import DeployAgentModal from '../components/DeployAgentModal';
import * as api from '../lib/api';
import {
  Robot,
  Lightning,
  Clock,
  ArrowsDownUp,
  CaretDown,
  CaretRight,
  CheckCircle,
  Pause,
  Play,
  Trash,
  PencilSimple,
  X,
  Camera,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

interface EnrichedAgent {
  id: string;
  name: string;
  workspace: string;
  agentDir?: string | null;
  model?: string | null;
  isActive: boolean;
  isSubagent: boolean;
  description?: string | null;
  skills: string;
  soulContent?: string | null;
  parentAgentId?: string | null;
  projectIds: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  // Enriched fields
  lastActiveAt: string | null;
  runCount: number;
  completedCount: number;
  successRate: number;
  totalTokens: number;
  totalCost: number;
}

export default function Agents() {
  const { agents: allAgents, loading, error, syncAgents, toggleAgent, refetch: refetchAgents } = useAgents();
  const { isAdmin } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [subagents, setSubagents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [agentActivity, setAgentActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [sortField, setSortField] = useState<'name' | 'totalCost' | 'runCount' | 'lastActiveAt'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingAgent, setEditingAgent] = useState<EnrichedAgent | null>(null);

  // Cast agents as enriched type
  const agents = allAgents as unknown as EnrichedAgent[];

  // Filter: Only show HEYMACHA and Livescape agents
  const livescapeAgentIds = [
    'ls-commander',
    'livescape-scout', 'livescape-pulse', 'livescape-radar',
    'livescape-meta', 'livescape-audit', 'livescape-trends',
    'livescape-brand', 'livescape-brain', 'livescape-forge',
  ];
  const openClawAgents = agents.filter(a => livescapeAgentIds.includes(a.id));

  // Sort agents
  const sortedAgents = [...openClawAgents].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'totalCost': return (a.totalCost - b.totalCost) * dir;
      case 'runCount': return (a.runCount - b.runCount) * dir;
      case 'lastActiveAt': {
        const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return (aTime - bTime) * dir;
      }
      default: return a.name.localeCompare(b.name) * dir;
    }
  });

  useEffect(() => {
    loadSubagents();
    loadProjects();
  }, []);

  // Live updates via WebSocket
  const wsReload = useCallback(() => {
    refetchAgents();
    loadSubagents();
  }, [refetchAgents]);

  useWebSocket({
    onEvent: {
      agent_updated: wsReload,
      agent_toggled: wsReload,
    },
  });

  const loadSubagents = async () => {
    try {
      const data = await api.agents.subagents.list();
      setSubagents(data);
    } catch (err) {
      console.error('Failed to load subagents:', err);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await api.projects.list();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleExpandAgent = async (agentId: string) => {
    if (expandedAgent === agentId) {
      setExpandedAgent(null);
      return;
    }
    setExpandedAgent(agentId);
    setActivityLoading(true);
    try {
      const response = await fetch(`/api/agents/${agentId}/activity?limit=10`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      const data = await response.json();
      setAgentActivity(data);
    } catch {
      setAgentActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleSyncClick = () => {
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError('');
  };

  const handleSyncWithPassword = async () => {
    if (!password.trim()) {
      setPasswordError('Password required');
      return;
    }
    try {
      const result = await api.system.verifySyncPassword(password);
      if (result.valid) {
        setShowPasswordModal(false);
        setSyncing(true);
        setSyncResult(null);
        try {
          const syncResult = await syncAgents();
          setSyncResult(`Synced ${syncResult.synced} agent(s) from OpenClaw config`);
          setTimeout(() => setSyncResult(null), 5000);
        } catch (err) {
          setSyncResult(err instanceof Error ? err.message : 'Sync failed');
        } finally {
          setSyncing(false);
        }
      }
    } catch {
      setPasswordError('Incorrect password');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleAgent(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle agent');
    }
  };

  const handleDeleteSubagent = async (id: string, name: string) => {
    if (!confirm(`Delete subagent "${name}"? This cannot be undone.`)) return;
    try {
      await api.agents.subagents.delete(id);
      await loadSubagents();
      setSyncResult(`Deleted subagent "${name}"`);
      setTimeout(() => setSyncResult(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete subagent');
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getSkills = (skillsJson: string) => {
    try { return JSON.parse(skillsJson) || []; } catch { return []; }
  };

  const getProjectNames = (projectIds: string) => {
    try {
      const ids = JSON.parse(projectIds);
      return ids.map((id: string) => projects.find(p => p.id === id)?.name || id).join(', ') || 'None';
    } catch { return 'None'; }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between fade-in-up">
        <div>
          <h1 className="cyber-heading text-4xl font-bold mb-2">AI AGENT SWARM</h1>
          <p className="text-cyber-text-secondary font-body">
            Manage HEYMACHA, Livescape agents, and custom subagents
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowDeployModal(true)}
              className="cyber-btn px-4 py-2 text-sm font-heading uppercase tracking-wide"
            >
              + Deploy Agent
            </button>
          )}
          <button
            onClick={handleSyncClick}
            disabled={syncing}
            className="px-4 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary hover:border-cyber-cyan transition-colors disabled:opacity-50 font-heading uppercase tracking-wide"
          >
            {syncing ? 'Syncing...' : 'Sync OpenClaw'}
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="cyber-card p-6 w-full max-w-md">
            <h2 className="font-heading text-xl font-bold text-cyber-cyan mb-4">SYNC FROM OPENCLAW</h2>
            <p className="text-sm text-cyber-text-secondary mb-4">Enter password to sync agents from OpenClaw config.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSyncWithPassword(); }}
              placeholder="Enter sync password"
              className="w-full px-4 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-cyber-text-primary text-sm font-mono mb-2"
              autoFocus
            />
            {passwordError && <p className="text-cyber-red text-xs mb-2">{passwordError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={handleSyncWithPassword} className="cyber-btn flex-1 py-2 text-sm">Verify & Sync</button>
              <button onClick={() => { setShowPasswordModal(false); setPassword(''); }} className="flex-1 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary hover:border-cyber-cyan">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDeployModal && (
        <DeployAgentModal
          onClose={() => setShowDeployModal(false)}
          onSuccess={() => {
            loadSubagents();
            setSyncResult('Subagent deployed successfully!');
            setTimeout(() => setSyncResult(null), 5000);
          }}
        />
      )}

      {/* Status Banner */}
      {syncResult && (
        <div className={`cyber-card p-3 text-sm fade-in-up ${
          syncResult.includes('failed') || syncResult.includes('Failed')
            ? 'border-cyber-red/50 text-cyber-red'
            : 'border-cyber-green/50 text-cyber-green'
        }`}>
          {syncResult}
        </div>
      )}

      {error && (
        <div className="cyber-card border-cyber-red/50 p-3 text-sm text-cyber-red">{error}</div>
      )}

      {/* Agent Data Table */}
      {loading ? (
        <div className="cyber-card p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* Core Agents Table */}
          <div className="cyber-card overflow-hidden fade-in-up stagger-1">
            <div className="px-6 py-4 border-b border-cyber-border">
              <h2 className="font-heading text-lg font-bold text-cyber-cyan uppercase tracking-wider">
                HEYMACHA & Core Agents
              </h2>
              <p className="text-xs text-cyber-text-dim mt-1">{sortedAgents.length} agents registered</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyber-border text-left">
                    <th className="px-6 py-3 text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading w-8" />
                    <th
                      className="px-6 py-3 text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading cursor-pointer hover:text-cyber-cyan"
                      onClick={() => handleSort('name')}
                    >
                      Agent {sortField === 'name' && <ArrowsDownUp size={10} weight="bold" className="inline ml-1" />}
                    </th>
                    <th className="px-4 py-3 text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading">Status</th>
                    <th className="px-4 py-3 text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading">Model</th>
                    <th
                      className="px-4 py-3 text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading cursor-pointer hover:text-cyber-cyan"
                      onClick={() => handleSort('lastActiveAt')}
                    >
                      Last Active {sortField === 'lastActiveAt' && <ArrowsDownUp size={10} weight="bold" className="inline ml-1" />}
                    </th>
                    <th className="px-4 py-3 text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading text-right">Tokens</th>
                    <th
                      className="px-4 py-3 text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading text-right cursor-pointer hover:text-cyber-cyan"
                      onClick={() => handleSort('totalCost')}
                    >
                      Cost {sortField === 'totalCost' && <ArrowsDownUp size={10} weight="bold" className="inline ml-1" />}
                    </th>
                    <th
                      className="px-4 py-3 text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading text-right cursor-pointer hover:text-cyber-cyan"
                      onClick={() => handleSort('runCount')}
                    >
                      Runs {sortField === 'runCount' && <ArrowsDownUp size={10} weight="bold" className="inline ml-1" />}
                    </th>
                    <th className="px-4 py-3 text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading text-right">Success</th>
                    {isAdmin && <th className="px-4 py-3 text-[10px] text-cyber-text-dim uppercase tracking-wider font-heading text-center">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedAgents.map((agent) => (
                    <>
                      <tr
                        key={agent.id}
                        className="border-b border-cyber-border/50 hover:bg-cyber-bg-tertiary/50 cursor-pointer transition-colors"
                        onClick={() => handleExpandAgent(agent.id)}
                      >
                        <td className="px-6 py-3">
                          {expandedAgent === agent.id ? (
                            <CaretDown size={12} className="text-cyber-cyan" />
                          ) : (
                            <CaretRight size={12} className="text-cyber-text-dim" />
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            {agent.imageUrl ? (
                              <img
                                src={`/api${agent.imageUrl}`}
                                alt={agent.name}
                                className="w-8 h-8 rounded-full border border-cyber-border object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-cyber-bg-tertiary border border-cyber-border flex items-center justify-center">
                                <Robot size={14} className="text-cyber-cyan" />
                              </div>
                            )}
                            <div>
                              <span className="text-sm font-medium text-cyber-text-primary">
                                {agent.name.replace('livescape-', '').replace('ls-', '').toUpperCase()}
                              </span>
                              <p className="text-[10px] text-cyber-text-dim font-mono">{agent.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-mono ${
                            agent.isActive ? 'text-cyber-green' : 'text-cyber-text-dim'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              agent.isActive ? 'bg-cyber-green animate-pulse' : 'bg-cyber-text-dim'
                            }`} />
                            {agent.isActive ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-cyber-text-secondary font-mono">
                            {agent.model ? agent.model.replace('claude-', '').replace('-20250514', '') : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-cyber-text-secondary font-mono">
                            {formatTimeAgo(agent.lastActiveAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-cyber-text-secondary font-mono">
                            {agent.totalTokens > 0 ? agent.totalTokens.toLocaleString() : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-cyber-cyan font-mono font-bold">
                            {agent.totalCost > 0 ? `$${agent.totalCost.toFixed(4)}` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-cyber-text-secondary font-mono">
                            {agent.runCount || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-mono font-bold ${
                            agent.successRate >= 80 ? 'text-cyber-green' :
                            agent.successRate >= 50 ? 'text-cyber-yellow' :
                            agent.runCount > 0 ? 'text-cyber-red' : 'text-cyber-text-dim'
                          }`}>
                            {agent.runCount > 0 ? `${agent.successRate}%` : '-'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setEditingAgent(agent)}
                                className="p-1.5 rounded transition-colors hover:bg-cyber-cyan/10 text-cyber-text-dim hover:text-cyber-cyan"
                                title="Edit profile"
                              >
                                <PencilSimple size={14} />
                              </button>
                              <button
                                onClick={() => handleToggle(agent.id)}
                                className={`p-1.5 rounded transition-colors ${
                                  agent.isActive
                                    ? 'hover:bg-cyber-yellow/10 text-cyber-yellow'
                                    : 'hover:bg-cyber-green/10 text-cyber-green'
                                }`}
                                title={agent.isActive ? 'Pause' : 'Activate'}
                              >
                                {agent.isActive ? <Pause size={14} /> : <Play size={14} />}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Expanded Activity Row */}
                      {expandedAgent === agent.id && (
                        <tr key={`${agent.id}-expanded`}>
                          <td colSpan={isAdmin ? 10 : 9} className="px-6 py-4 bg-cyber-bg-tertiary/30">
                            <div className="space-y-3">
                              <h4 className="text-xs text-cyber-text-dim uppercase tracking-wider font-heading">
                                Recent Activity
                              </h4>
                              {activityLoading ? (
                                <div className="space-y-2">
                                  <Skeleton className="h-6 w-full" />
                                  <Skeleton className="h-6 w-3/4" />
                                </div>
                              ) : agentActivity.length > 0 ? (
                                <div className="space-y-2">
                                  {agentActivity.map((act: any) => (
                                    <div key={act.id} className="flex items-center gap-3 text-xs">
                                      {act.type === 'agent_completed' ? (
                                        <CheckCircle size={12} className="text-cyber-green flex-shrink-0" />
                                      ) : act.type === 'agent_started' ? (
                                        <Lightning size={12} className="text-cyber-yellow flex-shrink-0" />
                                      ) : (
                                        <Clock size={12} className="text-cyber-text-dim flex-shrink-0" />
                                      )}
                                      <span className="text-cyber-text-primary flex-1 truncate">
                                        {act.message?.length > 80 ? act.message.substring(0, 77) + '...' : act.message}
                                      </span>
                                      {act.metadata?.tokens && (
                                        <span className="text-cyber-text-dim font-mono">
                                          {act.metadata.tokens.toLocaleString()} tok
                                        </span>
                                      )}
                                      {act.metadata?.cost && (
                                        <span className="text-cyber-cyan font-mono font-bold">
                                          ${act.metadata.cost.toFixed(4)}
                                        </span>
                                      )}
                                      <span className="text-cyber-text-dim font-mono">
                                        {formatTimeAgo(act.createdAt)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-cyber-text-dim">No recent activity for this agent</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedAgents.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-cyber-text-dim">
                No agents found. Sync from OpenClaw to get started.
              </div>
            )}
          </div>

          {/* Custom Subagents */}
          {subagents.length > 0 && (
            <div className="cyber-card overflow-hidden fade-in-up stagger-2">
              <div className="px-6 py-4 border-b border-cyber-border">
                <h2 className="font-heading text-lg font-bold text-cyber-green uppercase tracking-wider">
                  Custom Subagents
                </h2>
                <p className="text-xs text-cyber-text-dim mt-1">{subagents.length} deployed</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {subagents.map((agent) => (
                  <div key={agent.id} className="cyber-card p-4 border-cyber-green/20">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {agent.imageUrl ? (
                          <img
                            src={`/api${agent.imageUrl}`}
                            alt={agent.name}
                            className="w-10 h-10 rounded-full border border-cyber-green/30 object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-cyber-bg-tertiary border border-cyber-green/30 flex items-center justify-center">
                            <Robot size={16} className="text-cyber-green" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-cyber-text-primary">{agent.name}</h3>
                          <p className="text-[10px] text-cyber-text-dim font-mono">{agent.id}</p>
                        </div>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-cyber-green animate-pulse' : 'bg-cyber-text-dim'}`} />
                    </div>

                    {agent.description && (
                      <p className="text-xs text-cyber-text-secondary mb-3">{agent.description}</p>
                    )}

                    {getSkills(agent.skills).length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {getSkills(agent.skills).map((skill: string, idx: number) => (
                          <span key={idx} className="cyber-badge cyber-badge-info text-[9px] px-1.5 py-0.5">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-cyber-text-dim mb-3">
                      Projects: {getProjectNames(agent.projectIds)}
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 pt-2 border-t border-cyber-border">
                        <button
                          onClick={() => handleToggle(agent.id)}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-heading uppercase tracking-wide transition-colors ${
                            agent.isActive
                              ? 'bg-cyber-bg-tertiary text-cyber-yellow hover:bg-cyber-yellow/10'
                              : 'bg-cyber-green/10 text-cyber-green hover:bg-cyber-green/20'
                          }`}
                        >
                          {agent.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setEditingAgent(agent)}
                          className="px-2 py-1.5 rounded text-xs text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
                          title="Edit profile"
                        >
                          <PencilSimple size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubagent(agent.id, agent.name)}
                          className="px-2 py-1.5 rounded text-xs text-cyber-red hover:bg-cyber-red/10 transition-colors"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Agent Modal */}
      {editingAgent && (
        <EditAgentModal
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSave={async () => {
            setEditingAgent(null);
            await loadSubagents();
            await refetchAgents();
          }}
        />
      )}
    </div>
  );
}

// ─── Edit Agent Modal ───────────────────────────────────────────────
function EditAgentModal({
  agent,
  onClose,
  onSave,
}: {
  agent: EnrichedAgent;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(agent.name);
  const [imageUrl, setImageUrl] = useState(agent.imageUrl || '');
  const [imagePreview, setImagePreview] = useState<string | null>(
    agent.imageUrl ? `/api${agent.imageUrl}` : null
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const result = await api.uploads.uploadAgentImage(file);
      setImageUrl(result.imageUrl);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Failed to upload image');
      setImagePreview(agent.imageUrl ? `/api${agent.imageUrl}` : null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: { name?: string; imageUrl?: string } = {};
      if (name !== agent.name) data.name = name;
      if (imageUrl !== (agent.imageUrl || '')) data.imageUrl = imageUrl;

      if (Object.keys(data).length === 0) {
        onClose();
        return;
      }

      if (agent.isSubagent) {
        await api.agents.subagents.update(agent.id, data);
      } else {
        await api.agents.update(agent.id, data);
      }

      toast.success('Agent profile updated');
      onSave();
    } catch (err) {
      toast.error('Failed to update agent');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="cyber-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl font-bold text-cyber-cyan">EDIT AGENT</h2>
          <button onClick={onClose} className="text-cyber-text-dim hover:text-cyber-cyan transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <label className="relative cursor-pointer group">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt={name}
                className="w-24 h-24 rounded-full border-2 border-cyber-border object-cover group-hover:border-cyber-cyan transition-colors"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-cyber-bg-tertiary border-2 border-cyber-border flex items-center justify-center group-hover:border-cyber-cyan transition-colors">
                <Robot size={32} className="text-cyber-text-dim" />
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
          <p className="text-[10px] text-cyber-text-dim mt-2 font-mono">
            {uploading ? 'Uploading...' : 'Click to change avatar'}
          </p>
        </div>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-xs text-cyber-text-dim uppercase tracking-wider font-heading mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary font-mono focus:outline-none focus:border-cyber-cyan transition-colors"
          />
        </div>

        {/* Agent ID (read-only) */}
        <div className="mb-6">
          <label className="block text-xs text-cyber-text-dim uppercase tracking-wider font-heading mb-2">
            Agent ID
          </label>
          <div className="px-4 py-2 bg-cyber-bg-tertiary/50 border border-cyber-border/50 rounded text-sm text-cyber-text-dim font-mono">
            {agent.id}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-cyber-bg-tertiary border border-cyber-border rounded text-sm text-cyber-text-primary hover:border-cyber-cyan transition-colors font-heading uppercase tracking-wide"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading || !name.trim()}
            className="flex-1 cyber-btn py-2 text-sm font-heading uppercase tracking-wide disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
