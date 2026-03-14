import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { MagnifyingGlass, MapPin, Users as UsersIcon, Calendar } from '@phosphor-icons/react';
import { toast } from 'sonner';

export default function VenueSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    
    // TODO: Wire to venue-scout agent
    toast.info('Venue Scout Agent', {
      description: `Searching for venues in ${searchQuery}...`,
    });

    // Simulate agent call
    setTimeout(() => {
      setLoading(false);
      toast.success('Search Complete', {
        description: 'Venue intelligence compiled by VENUE-SCOUT 🏟️',
      });
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="cyber-heading text-4xl font-bold mb-2">Venue Intelligence</h1>
        <p className="text-cyber-text-secondary font-body">
          Search venues and get capacity, location, and booking intelligence
        </p>
      </div>

      {/* Search Form */}
      <Card className="cyber-card fade-in-up stagger-1">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Search Venues</CardTitle>
          <CardDescription>
            Search by city, venue name, or region (SEA markets)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., IMPACT Arena Bangkok, Kuala Lumpur venues"
              className="flex-1 px-4 py-3 bg-cyber-bg-tertiary border border-cyber-border rounded-lg text-cyber-text-primary placeholder-cyber-text-dim focus:outline-none focus:border-cyber-cyan font-body"
              style={{ color: '#e2e8f0' }}
            />
            <Button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-cyber-cyan text-cyber-bg-primary rounded-lg hover:bg-cyber-cyan-dim disabled:opacity-50 font-heading font-bold"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cyber-card cyber-glow-hover fade-in-up stagger-2 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-3">
              <MapPin size={32} className="text-cyber-cyan" />
              <div>
                <h3 className="font-heading text-sm font-bold">Malaysia</h3>
                <p className="text-xs text-cyber-text-dim">KL, Penang, Johor</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-cyber-text-secondary font-mono">
              <span>12 venues</span>
              <span>•</span>
              <span>5K-15K capacity</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cyber-card cyber-glow-hover fade-in-up stagger-3 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-3">
              <MapPin size={32} className="text-cyber-purple" />
              <div>
                <h3 className="font-heading text-sm font-bold">Thailand</h3>
                <p className="text-xs text-cyber-text-dim">Bangkok, Phuket</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-cyber-text-secondary font-mono">
              <span>8 venues</span>
              <span>•</span>
              <span>3K-12K capacity</span>
            </div>
          </CardContent>
        </Card>

        <Card className="cyber-card cyber-glow-hover fade-in-up stagger-4 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-3">
              <MapPin size={32} className="text-cyber-green" />
              <div>
                <h3 className="font-heading text-sm font-bold">Singapore</h3>
                <p className="text-xs text-cyber-text-dim">Marina Bay, Sentosa</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-cyber-text-secondary font-mono">
              <span>6 venues</span>
              <span>•</span>
              <span>2K-8K capacity</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Status */}
      <Card className="cyber-card fade-in-up stagger-5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span className="cyber-badge cyber-badge-info">VENUE-SCOUT</span>
              <span className="text-sm text-cyber-text-secondary font-mono">Ready to deploy</span>
            </div>
            <button className="cyber-badge cyber-badge-success cursor-pointer hover:bg-cyber-green/20">
              Launch Agent
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Info Panel */}
      <Card className="cyber-card fade-in-up stagger-6">
        <CardHeader>
          <CardTitle className="font-heading text-sm">Venue Intelligence Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <UsersIcon size={24} className="mx-auto mb-2 text-cyber-cyan" />
              <p className="text-xs text-cyber-text-dim">Capacity Analysis</p>
            </div>
            <div className="text-center">
              <MapPin size={24} className="mx-auto mb-2 text-cyber-purple" />
              <p className="text-xs text-cyber-text-dim">Location Data</p>
            </div>
            <div className="text-center">
              <Calendar size={24} className="mx-auto mb-2 text-cyber-green" />
              <p className="text-xs text-cyber-text-dim">Availability</p>
            </div>
            <div className="text-center">
              <MagnifyingGlass size={24} className="mx-auto mb-2 text-cyber-yellow" />
              <p className="text-xs text-cyber-text-dim">Past Events</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
