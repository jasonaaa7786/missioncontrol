import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Database, MagnifyingGlass, FileText, ChartBar } from '@phosphor-icons/react';

export default function DatabaseSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'artists' | 'venues' | 'campaigns'>('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement database search
    console.log('Search:', searchQuery, 'Type:', searchType);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="cyber-heading text-4xl font-bold mb-2">Database Search</h1>
        <p className="text-cyber-text-secondary font-body">
          Query Livescape intelligence database
        </p>
      </div>

      {/* Search Form */}
      <Card className="cyber-card fade-in-up stagger-1">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Search Database</CardTitle>
          <CardDescription>
            Full-text search across artist briefs, venue data, and campaign intelligence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Type Selector */}
          <div className="flex gap-2">
            {['all', 'artists', 'venues', 'campaigns'].map((type) => (
              <button
                key={type}
                onClick={() => setSearchType(type as any)}
                className={`px-4 py-2 rounded-lg font-heading text-sm font-bold uppercase transition-all ${
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
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., ASOT Vietnam, KI/KI, techno festivals"
              className="flex-1 px-4 py-3 bg-cyber-bg-tertiary border border-cyber-border rounded-lg text-cyber-text-primary placeholder-cyber-text-dim focus:outline-none focus:border-cyber-cyan font-body"
            />
            <Button
              type="submit"
              className="px-6 py-3 bg-cyber-cyan text-cyber-bg-primary rounded-lg hover:bg-cyber-cyan-dim font-heading font-bold"
            >
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cyber-card fade-in-up stagger-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Database size={24} className="text-cyber-cyan" />
              <span className="text-2xl font-mono font-bold text-cyber-cyan">142</span>
            </div>
            <p className="text-xs text-cyber-text-dim uppercase tracking-wide">Artist Briefs</p>
          </CardContent>
        </Card>

        <Card className="cyber-card fade-in-up stagger-3">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={24} className="text-cyber-purple" />
              <span className="text-2xl font-mono font-bold text-cyber-purple">28</span>
            </div>
            <p className="text-xs text-cyber-text-dim uppercase tracking-wide">Venue Reports</p>
          </CardContent>
        </Card>

        <Card className="cyber-card fade-in-up stagger-4">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <ChartBar size={24} className="text-cyber-green" />
              <span className="text-2xl font-mono font-bold text-cyber-green">56</span>
            </div>
            <p className="text-xs text-cyber-text-dim uppercase tracking-wide">Campaign Analyses</p>
          </CardContent>
        </Card>

        <Card className="cyber-card fade-in-up stagger-5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <MagnifyingGlass size={24} className="text-cyber-yellow" />
              <span className="text-2xl font-mono font-bold text-cyber-yellow">1.2K</span>
            </div>
            <p className="text-xs text-cyber-text-dim uppercase tracking-wide">Total Records</p>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Panel */}
      <Card className="cyber-card fade-in-up stagger-6">
        <CardContent className="p-8 text-center">
          <Database size={64} className="mx-auto mb-4 text-cyber-cyan opacity-50" />
          <h3 className="font-heading text-xl font-bold mb-2 text-cyber-text-primary">
            Database Search - Coming Soon
          </h3>
          <p className="text-cyber-text-secondary font-body max-w-2xl mx-auto">
            Full-text search across all Livescape intelligence will be available soon. 
            This feature will enable instant queries across artist briefs, venue intelligence, 
            campaign analytics, and historical data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
