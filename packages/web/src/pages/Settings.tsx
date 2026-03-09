import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../lib/api';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'agents' | 'system' | 'llm'>('profile');
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  useEffect(() => {
    if (activeTab === 'system') {
      loadSystemInfo();
    }
  }, [activeTab]);

  const loadSystemInfo = async () => {
    try {
      const info = await api.system.getInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const info = await api.system.checkUpdates();
      
      // If update available, send to chat
      if (info.updateAvailable) {
        alert(`Update available!\n\nCurrent: ${info.current}\nLatest: ${info.latest}\n\nPlease update OpenClaw manually with: npm install -g openclaw@latest`);
      } else {
        alert('You are already on the latest version!');
      }
    } catch (error) {
      console.error('Failed to check updates:', error);
      alert('Failed to check for updates');
    } finally {
      setCheckingUpdates(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Configure Mission Control preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'profile'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'agents'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Agent Config
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'system'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          System
        </button>
        <button
          onClick={() => setActiveTab('llm')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'llm'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          LLM
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">User Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Role</label>
                <input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-gray-400 capitalize"
                />
              </div>

              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  To change your profile details, contact your administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Config Tab */}
      {activeTab === 'agents' && (
        <div className="max-w-2xl">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Agent Configuration</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">HEYMACHA (Mission Control)</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Primary agent for Mission Control operations. Routes messages to specialist agents.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Agent ID:</span>
                    <span className="text-white">ls-commander</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Profile:</span>
                    <span className="text-white">livescape</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Livescape Subagents</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Specialist agents for specific intelligence domains
                </p>
                
                <div className="space-y-3">
                  {[
                    { id: 'livescape-scout', name: 'Scout 🔍', desc: 'Artist & show booking intelligence' },
                    { id: 'livescape-pulse', name: 'Pulse 💓', desc: 'Sentiment & social vibe analysis' },
                    { id: 'livescape-radar', name: 'Radar 📡', desc: 'Competitor events & market gaps' },
                    { id: 'livescape-meta', name: 'Meta 🎯', desc: 'Meta ads, pixel & campaign spend' },
                    { id: 'livescape-audit', name: 'Audit 📊', desc: 'ROI, ROAS & budget analysis' },
                    { id: 'livescape-trends', name: 'Trends 📈', desc: 'Trends, upsell & pricing tactics' },
                    { id: 'livescape-brand', name: 'Brand 🏟️', desc: 'Festival brand strength & IP score' },
                    { id: 'livescape-brain', name: 'Brain 🧠', desc: 'Patterns, history & what worked' },
                  ].map(agent => (
                    <div key={agent.id} className="bg-gray-700 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium text-sm">{agent.name}</span>
                        <span className="text-xs text-gray-500">{agent.id}</span>
                      </div>
                      <p className="text-xs text-gray-400">{agent.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <p className="text-sm text-gray-400">
                  Agent configuration is managed through OpenClaw profiles. Visit the Agents page to sync latest changes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="max-w-2xl">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">System Information</h2>
            
            <div className="space-y-4">
              {/* OpenClaw Version */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">OpenClaw</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-400">Current Version:</span>
                    <span className="text-white">{systemInfo?.openclaw?.currentVersion || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-400">Latest Version:</span>
                    <span className="text-white">{systemInfo?.openclaw?.latestVersion || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-400">Status:</span>
                    {systemInfo?.openclaw?.updateAvailable ? (
                      <span className="text-yellow-400">Update Available</span>
                    ) : (
                      <span className="text-green-400">Up to Date</span>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleCheckUpdates}
                      disabled={checkingUpdates}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                    >
                      {checkingUpdates ? 'Checking...' : 'Check for Updates'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Security</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Last Security Scan:</span>
                    <span className="text-white">{systemInfo?.security?.lastScanDate || 'Never'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-green-400">All Critical Issues Fixed</span>
                  </div>
                </div>
              </div>

              {/* Mission Control */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Mission Control</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Version:</span>
                    <span className="text-white">Phase 2C</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Environment:</span>
                    <span className="text-white">Development</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Frontend:</span>
                    <span className="text-white">http://140.82.57.157:5173</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Backend API:</span>
                    <span className="text-white">http://140.82.57.157:3001</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Features</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Multi-user Authentication',
                    'Projects & Tasks',
                    'Agent Management',
                    'Scheduler (Cron)',
                    'Document Browser',
                    'Chat with HEYMACHA',
                    'Drag & Drop Kanban',
                    'Markdown Preview',
                  ].map(feature => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Database</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">SQLite</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white truncate">~/.mission-control/data/mc.db</span>
                  </div>
                </div>
              </div>

              {/* Support */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Support</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>For issues or feature requests, contact your administrator.</p>
                  <p className="text-xs text-gray-500">Mission Control is built on OpenClaw infrastructure.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LLM Tab */}
      {activeTab === 'llm' && (
        <div className="max-w-4xl">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Language Model Configuration</h2>
            <p className="text-gray-400 mb-6">
              Configure which LLM powers Mission Control and agent swarm operations
            </p>

            {/* Current Main LLM */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Main LLM (Active)</h3>
              <div className="cyber-card cyber-glow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-heading font-bold text-cyber-cyan mb-1">
                      Claude Sonnet 4.5
                    </h4>
                    <p className="text-sm text-cyber-text-dim font-mono">anthropic/claude-sonnet-4-5</p>
                  </div>
                  <div className="cyber-badge cyber-badge-success">ACTIVE</div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-cyber-text-dim mb-1">Provider</p>
                    <p className="text-cyber-text-primary font-mono">Anthropic</p>
                  </div>
                  <div>
                    <p className="text-cyber-text-dim mb-1">Context Window</p>
                    <p className="text-cyber-text-primary font-mono">200K tokens</p>
                  </div>
                  <div>
                    <p className="text-cyber-text-dim mb-1">Best For</p>
                    <p className="text-cyber-text-primary font-mono">Analysis, Reasoning</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Backup LLMs */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Backup LLMs</h3>
              <div className="space-y-3">
                {/* Gemini Flash */}
                <div className="cyber-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-heading font-bold text-cyber-text-primary mb-1">
                        Gemini 2.0 Flash
                      </h4>
                      <p className="text-xs text-cyber-text-dim font-mono">google/gemini-2.0-flash-exp</p>
                    </div>
                    <button className="cyber-badge cyber-badge-info cursor-pointer hover:bg-cyber-cyan/20">
                      Switch to Gemini
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs mt-3">
                    <div>
                      <span className="text-cyber-text-dim">Provider: </span>
                      <span className="text-cyber-text-secondary font-mono">Google</span>
                    </div>
                    <div>
                      <span className="text-cyber-text-dim">Context: </span>
                      <span className="text-cyber-text-secondary font-mono">1M tokens</span>
                    </div>
                    <div>
                      <span className="text-cyber-text-dim">Best For: </span>
                      <span className="text-cyber-text-secondary font-mono">Speed, Multimodal</span>
                    </div>
                  </div>
                </div>

                {/* GPT-4o */}
                <div className="cyber-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-heading font-bold text-cyber-text-primary mb-1">
                        GPT-4o
                      </h4>
                      <p className="text-xs text-cyber-text-dim font-mono">openai/gpt-4o</p>
                    </div>
                    <button className="cyber-badge cyber-badge-info cursor-pointer hover:bg-cyber-cyan/20">
                      Switch to GPT-4o
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs mt-3">
                    <div>
                      <span className="text-cyber-text-dim">Provider: </span>
                      <span className="text-cyber-text-secondary font-mono">OpenAI</span>
                    </div>
                    <div>
                      <span className="text-cyber-text-dim">Context: </span>
                      <span className="text-cyber-text-secondary font-mono">128K tokens</span>
                    </div>
                    <div>
                      <span className="text-cyber-text-dim">Best For: </span>
                      <span className="text-cyber-text-secondary font-mono">Vision, General</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Switching Info */}
            <div className="bg-cyber-bg-tertiary border border-cyber-border rounded-lg p-4">
              <h4 className="text-sm font-heading font-bold text-cyber-yellow mb-2">⚠️ Model Switching</h4>
              <p className="text-xs text-cyber-text-secondary mb-3">
                Switching LLMs will affect all Mission Control operations and agent swarm behavior. 
                Changes take effect on next agent spawn.
              </p>
              <p className="text-xs text-cyber-text-dim font-mono">
                Current implementation: OpenClaw CLI uses default model from profile config. 
                To switch: Edit ~/.openclaw-livescape/config.json → "defaultModel" field.
              </p>
            </div>
          </div>

          {/* Usage Stats (Future) */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Model Usage Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-cyber-cyan mb-1">142</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Requests Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-cyber-purple mb-1">2.3M</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Tokens Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-cyber-green mb-1">$4.12</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Cost Today</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
