import { useState, useEffect } from 'react';
import * as api from '../lib/api';
import type { Project } from '@mc/shared';

interface DeployAgentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SOUL_TEMPLATE = `# IDENTITY
You are [AGENT_NAME], a specialist subagent for Livescape Group.

# PURPOSE
[Describe your specific focus and expertise]

# SKILLS
[List your key capabilities]

# OPERATING PRINCIPLES
1. Report findings to HEYMACHA (Mission Control)
2. Focus on your specialized domain
3. Provide actionable intelligence
4. Use data-driven insights

# COMMUNICATION STYLE
[Describe how you communicate - formal, casual, technical, etc.]

# CONSTRAINTS
- Work only on assigned projects
- Defer to HEYMACHA for cross-domain decisions
- Stay within your expertise area
`;

export default function DeployAgentModal({ onClose, onSuccess }: DeployAgentModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skills: '',
    soulContent: SOUL_TEMPLATE,
    projectIds: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.projects.list();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Agent name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const skills = formData.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const soulContent = formData.soulContent
        .replace('[AGENT_NAME]', formData.name);

      await api.agents.subagents.create({
        name: formData.name,
        description: formData.description || undefined,
        skills,
        soulContent,
        projectIds: formData.projectIds,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create subagent');
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projectIds: prev.projectIds.includes(projectId)
        ? prev.projectIds.filter(id => id !== projectId)
        : [...prev.projectIds, projectId],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-3xl my-8">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Deploy New Subagent</h2>
          <p className="text-gray-400 mt-1">Create a specialist AI agent for your projects</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Basic Information</h3>
            
            <div>
              <label className="block text-gray-300 mb-2">
                Agent Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Trance Lineup Scout"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                ID will be auto-generated: {formData.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}
              </p>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What does this agent specialize in?"
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Skills (comma-separated)</label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="trance, lineup, artist-research"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Project Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Project Assignment</h3>
            <p className="text-sm text-gray-400">Select which projects this agent will work on</p>
            
            {projects.length === 0 ? (
              <p className="text-gray-500 text-sm">No projects available. Create a project first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {projects.map(project => (
                  <label
                    key={project.id}
                    className="flex items-center gap-3 p-3 bg-gray-700 rounded border border-gray-600 cursor-pointer hover:bg-gray-650"
                  >
                    <input
                      type="checkbox"
                      checked={formData.projectIds.includes(project.id)}
                      onChange={() => toggleProject(project.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-white text-sm">{project.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* SOUL.md Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">SOUL.md Configuration</h3>
            <p className="text-sm text-gray-400">Define the agent's personality and operating instructions</p>
            
            <div>
              <textarea
                value={formData.soulContent}
                onChange={(e) => setFormData({ ...formData, soulContent: e.target.value })}
                rows={12}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-gray-300 font-mono text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-mission-600 hover:bg-mission-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Deploying...' : 'Deploy Subagent'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
