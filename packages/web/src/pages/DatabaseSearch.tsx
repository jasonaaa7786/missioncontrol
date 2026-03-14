import { useState } from 'react';
import { search } from '../lib/api';
import { MagnifyingGlass, Folder, ListChecks, Robot, Spinner } from '@phosphor-icons/react';

export default function DatabaseSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'artists' | 'venues' | 'campaigns'>('all');
  const [results, setResults] = useState<{
    projects: any[];
    tasks: any[];
    agents: any[];
    totalResults: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await search.query(searchQuery, searchType);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="cyber-heading text-2xl font-bold mb-1">Search Database</h1>
        <p className="text-cyber-text-secondary text-sm font-body">
          Full-text search across artist briefs, venue data, and campaign intelligence
        </p>
      </div>

      {/* Search Form */}
      <div className="cyber-card p-4 fade-in-up stagger-1">
        {/* Type Tabs */}
        <div className="flex gap-1.5 mb-3">
          {(['all', 'artists', 'venues', 'campaigns'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`px-3 py-1.5 rounded text-xs font-heading font-bold uppercase transition-all ${
                searchType === type
                  ? 'bg-cyber-cyan text-cyber-bg-primary'
                  : 'bg-cyber-bg-tertiary text-cyber-text-dim hover:text-cyber-text-primary'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., ASOT Vietnam, KI/KI, techno festivals"
            className="flex-1 px-4 py-2.5 bg-cyber-bg-tertiary border border-cyber-border rounded-lg text-white caret-white placeholder-cyber-text-dim focus:outline-none focus:border-cyber-cyan font-body text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="cyber-btn px-5 py-2.5 text-sm font-heading disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-cyber-red/10 border border-cyber-red/30 rounded-lg text-cyber-red text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-8">
          <Spinner size={24} className="text-cyber-cyan animate-spin mx-auto mb-2" />
          <p className="text-xs text-cyber-text-dim font-mono">Searching...</p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="space-y-4 fade-in-up">
          <p className="text-xs text-cyber-text-dim font-mono">
            {results.totalResults} result{results.totalResults !== 1 ? 's' : ''} for "{searchQuery}"
          </p>

          {/* Projects */}
          {results.projects.length > 0 && (
            <div>
              <h2 className="font-heading text-xs font-bold text-cyber-cyan uppercase tracking-wider mb-2 flex items-center gap-2">
                <Folder size={14} /> Projects ({results.projects.length})
              </h2>
              <div className="space-y-2">
                {results.projects.map((p: any) => (
                  <div key={p.id} className="cyber-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-cyber-text-primary">{p.name}</h3>
                        {p.description && (
                          <p className="text-xs text-cyber-text-dim line-clamp-1 mt-0.5">{p.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className={`cyber-badge text-[10px] px-2 py-0.5 ${
                          p.status === 'active' ? 'cyber-badge-success' : 'cyber-badge-info'
                        }`}>
                          {p.status}
                        </span>
                        <span className="text-[10px] text-cyber-text-dim font-mono">
                          {p._count?.tasks || 0} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div>
              <h2 className="font-heading text-xs font-bold text-cyber-purple uppercase tracking-wider mb-2 flex items-center gap-2">
                <ListChecks size={14} /> Tasks ({results.tasks.length})
              </h2>
              <div className="space-y-2">
                {results.tasks.map((t: any) => (
                  <div key={t.id} className="cyber-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-cyber-text-primary">{t.title}</h3>
                        <p className="text-[10px] text-cyber-text-dim mt-0.5">
                          {t.project?.name || 'No project'} · {t.assignedAgent || 'Unassigned'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className={`cyber-badge text-[10px] px-2 py-0.5 ${
                          t.status === 'done' ? 'cyber-badge-success' :
                          t.status === 'active' ? 'cyber-badge-info' :
                          'bg-cyber-bg-tertiary text-cyber-text-dim'
                        }`}>
                          {t.status}
                        </span>
                        <span className={`text-[10px] font-mono ${
                          t.priority === 'urgent' ? 'text-cyber-red' :
                          t.priority === 'high' ? 'text-cyber-yellow' :
                          'text-cyber-text-dim'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agents */}
          {results.agents.length > 0 && (
            <div>
              <h2 className="font-heading text-xs font-bold text-cyber-green uppercase tracking-wider mb-2 flex items-center gap-2">
                <Robot size={14} /> Agents ({results.agents.length})
              </h2>
              <div className="space-y-2">
                {results.agents.map((a: any) => (
                  <div key={a.id} className="cyber-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="cyber-badge cyber-badge-info text-[10px] px-2 py-0.5">
                          {a.name.replace('livescape-', '').toUpperCase()}
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full ${a.isActive ? 'bg-cyber-green' : 'bg-cyber-text-dim'}`} />
                      </div>
                      {a.description && (
                        <p className="text-xs text-cyber-text-dim line-clamp-1 ml-3">{a.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty */}
          {results.totalResults === 0 && (
            <div className="text-center py-8">
              <MagnifyingGlass size={32} className="text-cyber-text-dim mx-auto mb-2" />
              <p className="text-sm text-cyber-text-dim">No results found</p>
              <p className="text-xs text-cyber-text-dim mt-1">Try a different search term or category</p>
            </div>
          )}
        </div>
      )}

      {/* Initial empty state */}
      {!results && !loading && !error && (
        <div className="text-center py-10 fade-in-up">
          <MagnifyingGlass size={36} className="text-cyber-text-dim mx-auto mb-3" />
          <p className="text-sm text-cyber-text-secondary">Search across all Livescape intelligence</p>
        </div>
      )}
    </div>
  );
}
