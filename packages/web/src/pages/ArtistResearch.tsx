import { useState } from 'react';
import { youtube } from '../lib/api';

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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Artist Research</h1>
        <p className="text-gray-400 mt-2">Search for artists and view their YouTube statistics</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for an artist (e.g., KI/KI, Armin van Buuren)"
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !selectedChannel && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <div className="space-y-3">
            {searchResults.map((channel) => (
              <div
                key={channel.channelId}
                onClick={() => handleSelectChannel(channel.channelId)}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  {channel.thumbnails?.default?.url && (
                    <img
                      src={channel.thumbnails.default.url}
                      alt={channel.title}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{channel.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-1">{channel.description}</p>
                  </div>
                  <span className="text-blue-400">View Stats →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channel Details */}
      {selectedChannel && (
        <div>
          <button
            onClick={() => {
              setSelectedChannel(null);
              setSearchResults([]);
            }}
            className="mb-4 text-blue-400 hover:text-blue-300"
          >
            ← Back to search results
          </button>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-start gap-6 mb-6">
              {selectedChannel.thumbnails?.high?.url && (
                <img
                  src={selectedChannel.thumbnails.high.url}
                  alt={selectedChannel.title}
                  className="w-24 h-24 rounded-full"
                />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedChannel.title}</h2>
                {selectedChannel.customUrl && (
                  <p className="text-gray-400 mb-2">@{selectedChannel.customUrl}</p>
                )}
                {selectedChannel.country && (
                  <p className="text-gray-400 mb-2">📍 {selectedChannel.country}</p>
                )}
                <p className="text-gray-300 mt-3">{selectedChannel.description}</p>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-900/50 rounded-lg p-5 text-center">
                <p className="text-gray-400 text-sm mb-2">Subscribers</p>
                <p className="text-3xl font-bold text-blue-400">
                  {formatNumber(selectedChannel.statistics.subscriberCount)}
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-5 text-center">
                <p className="text-gray-400 text-sm mb-2">Total Views</p>
                <p className="text-3xl font-bold text-green-400">
                  {formatNumber(selectedChannel.statistics.viewCount)}
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-5 text-center">
                <p className="text-gray-400 text-sm mb-2">Videos</p>
                <p className="text-3xl font-bold text-purple-400">
                  {selectedChannel.statistics.videoCount}
                </p>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Avg Views per Video</p>
                <p className="text-xl font-semibold text-white">
                  {formatNumber(Math.round(selectedChannel.statistics.viewCount / selectedChannel.statistics.videoCount))}
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Channel ID</p>
                <p className="text-sm text-gray-300 font-mono truncate">{selectedChannel.channelId}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !selectedChannel && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-400">Search for an artist to view their YouTube statistics</p>
        </div>
      )}
    </div>
  );
}
