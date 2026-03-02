import { useState } from 'react';
import { useAgents } from '../hooks/useAgents';
import { useAuth } from '../contexts/AuthContext';

export default function Agents() {
  const { agents, loading, error, syncAgents, toggleAgent } = useAgents();
  const { isAdmin } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncAgents();
      setSyncResult(`Synced ${result.synced} agent(s) from OpenClaw config`);
      setTimeout(() => setSyncResult(null), 5000);
    } catch (err) {
      setSyncResult(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleAgent(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle agent');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Agents</h1>
          <p className="text-gray-400 mt-2">Manage OpenClaw agents</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-mission-600 hover:bg-mission-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          {syncing ? 'Syncing...' : 'Sync from OpenClaw'}
        </button>
      </div>

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

      {!loading && !error && agents.length === 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <p className="text-gray-400 mb-4">No agents synced yet. Click "Sync from OpenClaw" to import agents.</p>
        </div>
      )}

      {!loading && !error && agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
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
                  <span className="text-xs text-gray-400">{agent.isActive ? 'Active' : 'Inactive'}</span>
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
                {agent.agentDir && (
                  <div className="flex items-start gap-2 text-gray-400">
                    <span className="flex-shrink-0">🗂️</span>
                    <span className="truncate text-xs">{agent.agentDir}</span>
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
                  {agent.isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
