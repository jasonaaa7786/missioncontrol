import { useState } from 'react';
import { youtube } from '../lib/api';
import { MagnifyingGlass, MapPin, ArrowLeft, YoutubeLogo, Eye, VideoCamera, Users } from '@phosphor-icons/react';

interface ChannelStats {
  channelId: string;
  title: string;
  description: string;
  customUrl?: string;
  country?: string;
  statistics: {
    subscriberCount: number;
    viewCount: number;
    videoCount: number;
  };
  thumbnails: any;
}

export default function ArtistResearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedChannel(null);

    try {
      const results = await youtube.search(searchQuery, 5);
      setSearchResults(results.channels);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChannel = async (channelId: string) => {
    setLoading(true);
    setError(null);

    try {
      const channelData = await youtube.getChannel(channelId);
      setSelectedChannel(channelData);
    } catch (err: any) {
      setError(err.message || 'Failed to load channel data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="p-4 sm:p-6 fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-heading cyber-heading text-cyber-cyan">Artist Research</h1>
        <p className="text-cyber-text-secondary text-sm mt-1">Search for artists and view their YouTube statistics</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6 stagger-1">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for an artist (e.g., KI/KI, Armin van Buuren)"
            className="flex-1 px-4 py-2.5 bg-cyber-bg-secondary border border-cyber-border rounded-lg text-cyber-text-primary placeholder-cyber-text-dim focus:outline-none focus:border-cyber-cyan text-sm"
            style={{ color: '#e2e8f0' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="cyber-btn px-5 py-2.5 bg-cyber-cyan text-cyber-bg-primary rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-all"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-cyber-red/10 border border-cyber-red/30 rounded-lg text-cyber-red text-sm">
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !selectedChannel && (
        <div className="mb-6 stagger-2">
          <h2 className="text-lg font-heading cyber-heading text-cyber-text-primary mb-3">Search Results</h2>
          <div className="space-y-2">
            {searchResults.map((channel, index) => (
              <div
                key={channel.channelId}
                onClick={() => handleSelectChannel(channel.channelId)}
                className={`cyber-card p-3 hover:border-cyber-cyan cursor-pointer transition-all fade-in-up stagger-${index + 1}`}
              >
                <div className="flex items-center gap-3">
                  {channel.thumbnails?.default?.url && (
                    <img
                      src={channel.thumbnails.default.url}
                      alt={channel.title}
                      className="w-10 h-10 rounded-full ring-1 ring-cyber-border"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-cyber-text-primary">{channel.title}</h3>
                    <p className="text-xs text-cyber-text-dim line-clamp-1">{channel.description}</p>
                  </div>
                  <span className="text-cyber-cyan text-xs font-medium whitespace-nowrap">View Stats →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channel Details */}
      {selectedChannel && (
        <div className="fade-in-up">
          <button
            onClick={() => {
              setSelectedChannel(null);
              setSearchResults([]);
            }}
            className="mb-3 text-cyber-cyan hover:text-cyber-cyan/80 text-sm flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} weight="bold" />
            Back to search results
          </button>

          <div className="cyber-card p-4 sm:p-5">
            <div className="flex items-start gap-4 mb-4">
              {selectedChannel.thumbnails?.high?.url && (
                <img
                  src={selectedChannel.thumbnails.high.url}
                  alt={selectedChannel.title}
                  className="w-20 h-20 rounded-full ring-2 ring-cyber-cyan/30"
                />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-heading cyber-heading text-cyber-text-primary mb-1">{selectedChannel.title}</h2>
                {selectedChannel.customUrl && (
                  <p className="text-cyber-text-dim text-xs mb-1">@{selectedChannel.customUrl}</p>
                )}
                {selectedChannel.country && (
                  <p className="text-cyber-text-dim text-xs mb-1 flex items-center gap-1">
                    <MapPin size={12} weight="fill" className="text-cyber-purple" />
                    {selectedChannel.country}
                  </p>
                )}
                <p className="text-cyber-text-secondary text-xs mt-2 line-clamp-3">{selectedChannel.description}</p>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div className="bg-cyber-bg-primary/60 border border-cyber-border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <Users size={14} className="text-cyber-cyan" />
                  <p className="text-cyber-text-dim text-xs">Subscribers</p>
                </div>
                <p className="text-2xl font-bold text-cyber-cyan font-heading">
                  {formatNumber(selectedChannel.statistics.subscriberCount)}
                </p>
              </div>
              <div className="bg-cyber-bg-primary/60 border border-cyber-border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <Eye size={14} className="text-cyber-green" />
                  <p className="text-cyber-text-dim text-xs">Total Views</p>
                </div>
                <p className="text-2xl font-bold text-cyber-green font-heading">
                  {formatNumber(selectedChannel.statistics.viewCount)}
                </p>
              </div>
              <div className="bg-cyber-bg-primary/60 border border-cyber-border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <VideoCamera size={14} className="text-cyber-purple" />
                  <p className="text-cyber-text-dim text-xs">Videos</p>
                </div>
                <p className="text-2xl font-bold text-cyber-purple font-heading">
                  {selectedChannel.statistics.videoCount}
                </p>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-cyber-bg-primary/60 border border-cyber-border rounded-lg p-3">
                <p className="text-cyber-text-dim text-xs mb-1">Avg Views per Video</p>
                <p className="text-lg font-semibold text-cyber-text-primary">
                  {formatNumber(Math.round(selectedChannel.statistics.viewCount / selectedChannel.statistics.videoCount))}
                </p>
              </div>
              <div className="bg-cyber-bg-primary/60 border border-cyber-border rounded-lg p-3">
                <p className="text-cyber-text-dim text-xs mb-1">Channel ID</p>
                <p className="text-xs text-cyber-text-secondary font-mono truncate">{selectedChannel.channelId}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !selectedChannel && !loading && (
        <div className="text-center py-10 fade-in-up">
          <div className="mb-3 flex justify-center">
            <MagnifyingGlass size={48} weight="duotone" className="text-cyber-text-dim" />
          </div>
          <p className="text-cyber-text-secondary text-sm">Search for an artist to view their YouTube statistics</p>
        </div>
      )}
    </div>
  );
}
