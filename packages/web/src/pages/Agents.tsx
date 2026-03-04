import { useState, useEffect } from 'react';
import { useAgents } from '../hooks/useAgents';
import { useAuth } from '../contexts/AuthContext';
import DeployAgentModal from '../components/DeployAgentModal';
import * as api from '../lib/api';

export default function Agents() {
  const { agents: allAgents, loading, error, syncAgents, toggleAgent } = useAgents();
  const { isAdmin } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [subagents, setSubagents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Filter: Only show HEYMACHA (ls-commander) and Livescape subagents
  const livescapeAgentIds = [
    'ls-commander',
    'livescape-scout',
    'livescape-pulse',
    'livescape-radar',
    'livescape-meta',
    'livescape-audit',
    'livescape-trends',
    'livescape-brand',
    'livescape-brain',
    'livescape-forge',
  ];
  
  const openClawAgents = allAgents.filter(agent => livescapeAgentIds.includes(agent.id));

  useEffect(() => {
    loadSubagents();
    loadProjects();
  }, []);

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
      // Verify password first
      const result = await api.system.verifySyncPassword(password);
      
      if (result.valid) {
        // Password correct, proceed with sync
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
    } catch (err) {
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

  const getProjectNames = (projectIds: string) => {
    try {
      const ids = JSON.parse(projectIds);
      return ids.map((id: string) => {
        const project = projects.find(p => p.id === id);
        return project?.name || id;
      }).join(', ') || 'No projects assigned';
    } catch {
      return 'No projects assigned';
    }
  };

  const getSkills = (skillsJson: string) => {
    try {
      const skills = JSON.parse(skillsJson);
      return skills.length > 0 ? skills : [];
    } catch {
      return [];
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Agents</h1>
          <p className="text-gray-400 mt-2">Manage HEYMACHA, Livescape agents, and custom subagents</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowDeployModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              + Deploy New Agent
            </button>
          )}
          <button
            onClick={handleSyncClick}
            disabled={syncing}
            className="px-4 py-2 bg-mission-600 hover:bg-mission-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {syncing ? 'Syncing...' : 'Sync from OpenClaw'}
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">🔒 Sync from OpenClaw</h2>
            <p className="text-gray-400 mb-4">Enter password to sync agents from OpenClaw config.</p>
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSyncWithPassword();
                  }
                }}
                placeholder="Enter sync password"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
                autoFocus
              />
              {passwordError && (
                <p className="text-red-400 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSyncWithPassword}
                className="flex-1 px-4 py-2 bg-mission-600 hover:bg-mission-700 text-white rounded-lg font-medium transition-colors"
              >
                Verify & Sync
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
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

      {syncResult && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${
          syncResult.includes('failed') || syncResult.includes('Failed')
            ? 'bg-red-500/10 border border-red-500 text-red-400'
            : 'bg-green-500/10 border border-green-500 text-green-400'
        }`}>
          {syncResult}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mission-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading agents...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && openClawAgents.length === 0 && subagents.length === 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400 mb-4">No agents yet. Sync from OpenClaw or deploy a new subagent.</p>
        </div>
      )}

      {!loading && !error && (openClawAgents.length > 0 || subagents.length > 0) && (
        <div className="space-y-8">
          {/* OpenClaw Agents */}
          {openClawAgents.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">HEYMACHA & Core Agents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {openClawAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-gray-800 rounded-lg border border-gray-700 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{agent.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <span className="text-xs text-gray-400">{agent.isActive ? 'Active' : 'Paused'}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-start gap-2 text-gray-400">
                        <span className="flex-shrink-0">📁</span>
                        <span className="truncate">{agent.workspace}</span>
                      </div>
                      {agent.model && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <span>🧠</span>
                          <span className="truncate">{agent.model}</span>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleToggle(agent.id)}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                          agent.isActive
                            ? 'bg-gray-700 hover:bg-gray-600 text-white'
                            : 'bg-mission-600 hover:bg-mission-700 text-white'
                        }`}
                      >
                        {agent.isActive ? 'Pause' : 'Activate'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Subagents */}
          {subagents.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Custom Subagents ({subagents.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subagents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-lg border border-green-700/50 p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🤖</span>
                          <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{agent.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <span className="text-xs text-gray-400">{agent.isActive ? 'Active' : 'Paused'}</span>
                      </div>
                    </div>

                    {agent.description && (
                      <p className="text-sm text-gray-300 mb-3">{agent.description}</p>
                    )}

                    <div className="space-y-2 text-sm mb-4">
                      {getSkills(agent.skills).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {getSkills(agent.skills).map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-gray-400 text-xs">
                        <span className="font-medium">Projects:</span>{' '}
                        {getProjectNames(agent.projectIds)}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggle(agent.id)}
                          className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                            agent.isActive
                              ? 'bg-gray-700 hover:bg-gray-600 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {agent.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteSubagent(agent.id, agent.name)}
                          className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
