import { useState } from 'react';
import { search } from '../lib/api';
import { MagnifyingGlass, MapPin, Spinner, Folder, ListChecks } from '@phosphor-icons/react';

export default function VenueSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ projects: any[]; tasks: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await search.query(searchQuery, 'venues');
      setResults({ projects: data.projects, tasks: data.tasks });
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const quickSearches = [
    { label: 'Malaysia', query: 'Malaysia', color: 'text-cyber-cyan' },
    { label: 'Thailand', query: 'Thailand', color: 'text-cyber-purple' },
    { label: 'Singapore', query: 'Singapore', color: 'text-cyber-green' },
    { label: 'Vietnam', query: 'Vietnam', color: 'text-cyber-yellow' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="cyber-heading text-2xl font-bold mb-1">Venue Intelligence</h1>
        <p className="text-cyber-text-secondary text-sm font-body">
          Search venues and get capacity, location, and booking intelligence
        </p>
      </div>

      {/* Search Form */}
      <div className="cyber-card p-4 fade-in-up stagger-1">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., IMPACT Arena Bangkok, Kuala Lumpur venues"
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

        {/* Quick region buttons */}
        <div className="flex gap-2 mt-3">
          {quickSearches.map((qs) => (
            <button
              key={qs.label}
              onClick={() => {
                setSearchQuery(qs.query);
              }}
              className="px-3 py-1 text-xs bg-cyber-bg-tertiary border border-cyber-border rounded-full hover:border-cyber-cyan transition-colors text-cyber-text-secondary hover:text-cyber-cyan"
            >
              <MapPin size={10} className={`inline mr-1 ${qs.color}`} />
              {qs.label}
            </button>
          ))}
        </div>
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
          <p className="text-xs text-cyber-text-dim font-mono">Searching venues...</p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="space-y-4 fade-in-up">
          {/* Projects (venues are typically projects) */}
          {results.projects.length > 0 && (
            <div>
              <h2 className="font-heading text-xs font-bold text-cyber-cyan uppercase tracking-wider mb-2 flex items-center gap-2">
                <Folder size={14} /> Venues & Projects ({results.projects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.projects.map((p: any) => (
                  <div key={p.id} className="cyber-card p-3">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-cyber-cyan flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-cyber-text-primary">{p.name}</h3>
                        {p.description && (
                          <p className="text-xs text-cyber-text-dim line-clamp-2 mt-0.5">{p.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div>
              <h2 className="font-heading text-xs font-bold text-cyber-purple uppercase tracking-wider mb-2 flex items-center gap-2">
                <ListChecks size={14} /> Related Tasks ({results.tasks.length})
              </h2>
              <div className="space-y-2">
                {results.tasks.map((t: any) => (
                  <div key={t.id} className="cyber-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm text-cyber-text-primary">{t.title}</h3>
                        <p className="text-[10px] text-cyber-text-dim">{t.project?.name}</p>
                      </div>
                      <span className={`cyber-badge text-[10px] px-2 py-0.5 ${
                        t.status === 'done' ? 'cyber-badge-success' : 'cyber-badge-info'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty */}
          {results.projects.length === 0 && results.tasks.length === 0 && (
            <div className="text-center py-8">
              <MapPin size={32} className="text-cyber-text-dim mx-auto mb-2" />
              <p className="text-sm text-cyber-text-dim">No venues found</p>
              <p className="text-xs text-cyber-text-dim mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      {/* Initial empty state */}
      {!results && !loading && !error && (
        <div className="text-center py-10 fade-in-up">
          <MapPin size={36} className="text-cyber-text-dim mx-auto mb-3" />
          <p className="text-sm text-cyber-text-secondary">Search for venues by name, city, or region</p>
        </div>
      )}
    </div>
  );
}
