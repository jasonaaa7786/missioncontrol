import { useState } from 'react';
import { artist, spotify } from '../lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  MagnifyingGlass, ArrowLeft, YoutubeLogo, SpotifyLogo,
  InstagramLogo, TiktokLogo, FacebookLogo,
  ArrowUp, ArrowDown, Minus, Buildings,
  ArrowSquareOut, PencilSimple, Check, X,
  Spinner, CaretDown, CaretRight, UserFocus,
} from '@phosphor-icons/react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ArtistProfile {
  name: string;
  imageUrl: string | null;
  followers: number | null;
  popularity: number | null;
  genres: string[];
  spotifyId?: string;
  externalUrl?: string;
}

interface SocialSnapshot {
  youtubeSubscribers?: number;
  youtubeViews?: string;
  spotifyFollowers?: number;
  spotifyPopularity?: number;
  instagramFollowers?: number;
  tiktokFollowers?: number;
  tiktokLikes?: number;
  facebookPageLikes?: number;
  snapshotAt?: string;
}

interface Show {
  id: string;
  eventDate: string | null;
  venueName: string | null;
  venueCity: string | null;
  venueCountry: string | null;
  showType: string | null;
  capacity: number | null;
  source: string | null;
  sourceUrl: string | null;
}

interface Community {
  name: string;
  handle: string | null;
  followers: number | null;
  url: string | null;
  platform: string;
  country: string | null;
}

interface RedditMention {
  title: string;
  url: string;
  upvotes: number;
  comments: number;
  subreddit: string;
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface SnapshotPoint {
  snapshotAt: string;
  youtubeSubscribers: number | null;
  instagramFollowers: number | null;
  tiktokFollowers: number | null;
  facebookPageLikes: number | null;
  spotifyFollowers: number | null;
}

type TabId = 'overview' | 'communities' | 'shows' | 'agency';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtDelta(curr: number | null | undefined, prev: number | null | undefined) {
  if (curr == null || prev == null) return null;
  return curr - prev;
}

function showTypeBadge(type: string | null) {
  const map: Record<string, { label: string; color: string }> = {
    festival: { label: 'Festival', color: 'text-cyber-yellow border-cyber-yellow/40 bg-cyber-yellow/10' },
    stadium:  { label: 'Stadium',  color: 'text-cyber-red border-cyber-red/40 bg-cyber-red/10' },
    arena:    { label: 'Arena',    color: 'text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10' },
    live_house:{ label: 'Live House', color: 'text-cyber-green border-cyber-green/40 bg-cyber-green/10' },
    club:     { label: 'Club',     color: 'text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10' },
    unknown:  { label: 'Unknown',  color: 'text-cyber-text-dim border-cyber-border' },
  };
  const entry = map[type || 'unknown'] || map.unknown;
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${entry.color}`}>
      {entry.label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ArtistResearch() {
  // Search
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState<ArtistProfile[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Artist & snapshots
  const [selectedArtist, setSelectedArtist]       = useState<ArtistProfile | null>(null);
  const [currentSnapshot, setCurrentSnapshot]     = useState<SocialSnapshot | null>(null);
  const [previousSnapshot, setPreviousSnapshot]   = useState<SocialSnapshot | null>(null);
  const [youtubeChannel, setYoutubeChannel]       = useState<any | null>(null);
  const [snapshotHistory, setSnapshotHistory]     = useState<SnapshotPoint[]>([]);

  // Tab
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Communities
  const [communities, setCommunities]             = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [communitiesError, setCommunitiesError]   = useState<string | null>(null);
  const [communityListOpen, setCommunityListOpen] = useState(true);

  // Reddit
  const [redditMentions, setRedditMentions]       = useState<RedditMention[]>([]);
  const [redditSentiment, setRedditSentiment]     = useState({ score: 0, total: 0, positive: 0, negative: 0, neutral: 0 });
  const [redditLoading, setRedditLoading]         = useState(false);
  const [redditFetched, setRedditFetched]         = useState(false);

  // Shows
  const [shows, setShows]                         = useState<Show[]>([]);
  const [showsLoading, setShowsLoading]           = useState(false);
  const [showsError, setShowsError]               = useState<string | null>(null);
  const [editingShowId, setEditingShowId]         = useState<string | null>(null);
  const [editingCapacity, setEditingCapacity]     = useState('');

  // Agency
  const [agencyData, setAgencyData]               = useState<any | null>(null);
  const [agencyLoading, setAgencyLoading]         = useState(false);
  const [agencyError, setAgencyError]             = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedArtist(null);
    setSearchResults([]);

    try {
      const res = await spotify.search(searchQuery, 5);
      setSearchResults(res.artists.map(a => ({
        name: a.name, imageUrl: a.imageUrl, followers: a.followers,
        popularity: a.popularity, genres: a.genres,
        spotifyId: a.spotifyId, externalUrl: a.externalUrl || undefined,
      })));
    } catch {
      try {
        const res = await artist.search(searchQuery);
        const a = res.artist;
        setSearchResults([{
          name: a.name, imageUrl: a.imageUrl, followers: a.followers,
          popularity: a.popularity, genres: a.genres || [],
          spotifyId: a.spotifyId, externalUrl: a.externalUrl,
        }]);
      } catch (err2: any) {
        setError(err2.message || 'Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArtist = async (profile: ArtistProfile) => {
    setLoading(true);
    setError(null);
    setActiveTab('overview');
    setCommunities([]); setCommunitiesError(null);
    setShows([]); setShowsError(null);
    setAgencyData(null); setAgencyError(null);
    setRedditMentions([]); setRedditFetched(false);
    setSnapshotHistory([]);

    try {
      const res = await artist.search(profile.name);
      setSelectedArtist({ ...profile, ...res.artist });
      setYoutubeChannel(res.youtubeChannel);
      setCurrentSnapshot(res.socialSnapshot as SocialSnapshot);
      setPreviousSnapshot(res.previousSnapshot as SocialSnapshot);

      // Load snapshot history for chart (non-blocking)
      artist.getSnapshots(profile.name)
        .then(r => setSnapshotHistory(r.snapshots || []))
        .catch(() => {});
    } catch (err: any) {
      setSelectedArtist(profile);
      setError('Could not load full artist data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchCommunities = async () => {
    if (!selectedArtist) return;
    setCommunitiesLoading(true);
    setCommunitiesError(null);
    try {
      const res = await artist.getCommunities(selectedArtist.name);
      if (res.error) { setCommunitiesError(res.error); setCommunities([]); }
      else { setCommunities(res.communities); }
    } catch (err: any) {
      setCommunitiesError(err.message || 'Community search failed');
    } finally {
      setCommunitiesLoading(false);
    }
  };

  const handleFetchReddit = async () => {
    if (!selectedArtist) return;
    setRedditLoading(true);
    try {
      const res = await artist.getReddit(selectedArtist.name);
      setRedditMentions(res.mentions);
      setRedditSentiment(res.sentiment);
      setRedditFetched(true);
    } catch (err: any) {
      setRedditFetched(true);
    } finally {
      setRedditLoading(false);
    }
  };

  const handleFetchShows = async () => {
    if (!selectedArtist) return;
    setShowsLoading(true);
    setShowsError(null);
    try {
      const res = await artist.getShows(selectedArtist.name);
      setShows(res.shows);
      if (res.message) setShowsError(res.message);
    } catch (err: any) {
      setShowsError(err.message || 'Shows fetch failed');
    } finally {
      setShowsLoading(false);
    }
  };

  const handleFetchAgency = async () => {
    if (!selectedArtist) return;
    setAgencyLoading(true);
    setAgencyError(null);
    try {
      const res = await artist.getAgency(selectedArtist.name);
      if (res.error) setAgencyError(res.error);
      else setAgencyData(res);
    } catch (err: any) {
      setAgencyError(err.message || 'Agency search failed');
    } finally {
      setAgencyLoading(false);
    }
  };

  const handleSaveCapacity = async (show: Show) => {
    const cap = parseInt(editingCapacity, 10);
    if (isNaN(cap) || cap < 0 || !selectedArtist) return;
    try {
      const updated = await artist.updateShowCapacity(selectedArtist.name, show.id, cap);
      setShows(prev => prev.map(s => s.id === show.id ? { ...s, capacity: updated.capacity } : s));
    } catch {}
    setEditingShowId(null);
    setEditingCapacity('');
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3 fade-in-up">

      {/* ── Search Bar ── */}
      <div>
        <h1 className="text-sm font-heading uppercase tracking-widest text-cyber-text-dim">Artist Research</h1>
        <p className="text-[11px] text-cyber-text-dim mt-0.5">Intelligence hub for booking decisions</p>
        <form onSubmit={handleSearch} className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search artist name (e.g. KI/KI, Armin van Buuren, Martin Garrix)"
              className="w-full pl-8 pr-4 py-2 bg-cyber-bg-secondary border border-cyber-border rounded text-sm focus:outline-none focus:border-cyber-cyan transition-colors"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-cyber-cyan text-cyber-bg-primary rounded text-sm font-medium hover:brightness-110 disabled:opacity-50 transition-all font-heading"
          >
            {loading ? <Spinner size={14} className="animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-2.5 bg-cyber-red/10 border border-cyber-red/30 rounded text-cyber-red text-xs">{error}</div>
      )}

      {/* ── Search Results ── */}
      {searchResults.length > 0 && !selectedArtist && (
        <div className="cyber-card overflow-hidden">
          {searchResults.map((result, i) => (
            <button
              key={result.spotifyId || i}
              onClick={() => handleSelectArtist(result)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cyber-bg-tertiary/50 transition-colors border-b border-cyber-border/50 last:border-b-0 text-left"
            >
              {result.imageUrl
                ? <img src={result.imageUrl} alt={result.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-cyber-border flex-shrink-0" />
                : <div className="w-10 h-10 rounded-full bg-cyber-bg-tertiary flex items-center justify-center flex-shrink-0"><UserFocus size={20} className="text-cyber-text-dim" /></div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cyber-text-primary">{result.name}</p>
                <p className="text-[11px] text-cyber-text-dim truncate">{result.genres.slice(0, 3).join(' • ') || 'No genres listed'}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {result.followers != null && (
                  <div className="text-right">
                    <p className="text-xs font-mono text-cyber-text-primary">{fmt(result.followers)}</p>
                    <p className="text-[10px] text-cyber-text-dim">followers</p>
                  </div>
                )}
                <span className="text-cyber-cyan text-xs">→</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Artist Detail View ── */}
      {selectedArtist && (
        <div className="space-y-2.5">
          <button
            onClick={() => { setSelectedArtist(null); setSearchResults([]); }}
            className="flex items-center gap-1.5 text-cyber-cyan text-xs hover:text-cyber-cyan/80 transition-colors"
          >
            <ArrowLeft size={12} weight="bold" /> Back to results
          </button>

          {/* ── Two-column: Sidebar + Main ── */}
          <div className="flex gap-3 items-start">

            {/* Left Sidebar */}
            <div className="w-52 flex-shrink-0 space-y-2">

              {/* Artist Profile */}
              <div className="cyber-card p-3">
                {selectedArtist.imageUrl
                  ? <img src={selectedArtist.imageUrl} alt={selectedArtist.name}
                      className="w-full aspect-square rounded-lg object-cover ring-2 ring-cyber-cyan/20 mb-2.5" />
                  : <div className="w-full aspect-square rounded-lg bg-cyber-bg-tertiary flex items-center justify-center mb-2.5">
                      <UserFocus size={48} className="text-cyber-text-dim" />
                    </div>
                }
                <div className="flex items-start justify-between gap-1">
                  <h2 className="text-sm font-heading text-cyber-text-primary leading-tight">{selectedArtist.name}</h2>
                  {selectedArtist.externalUrl && (
                    <a href={selectedArtist.externalUrl} target="_blank" rel="noopener noreferrer"
                      className="text-cyber-cyan hover:text-cyber-cyan/80 flex-shrink-0 mt-0.5">
                      <ArrowSquareOut size={12} />
                    </a>
                  )}
                </div>
                {selectedArtist.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {selectedArtist.genres.slice(0, 3).map(g => (
                      <span key={g} className="text-[9px] px-1.5 py-0.5 rounded border border-cyber-border text-cyber-text-dim">{g}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Stats (sidebar) */}
              <div className="cyber-card p-3 space-y-2">
                <p className="text-[10px] font-heading uppercase tracking-widest text-cyber-text-dim">Social Stats</p>

                <SidebarStat
                  icon={<YoutubeLogo size={12} weight="fill" className="text-[#ff0000]" />}
                  label="YouTube"
                  value={fmt(currentSnapshot?.youtubeSubscribers ?? youtubeChannel?.subscribers)}
                  delta={fmtDelta(currentSnapshot?.youtubeSubscribers, previousSnapshot?.youtubeSubscribers)}
                />
                <SidebarStat
                  icon={<SpotifyLogo size={12} weight="fill" className="text-[#1DB954]" />}
                  label="Spotify"
                  value={currentSnapshot?.spotifyFollowers != null || selectedArtist.followers != null
                    ? fmt(currentSnapshot?.spotifyFollowers ?? selectedArtist.followers)
                    : 'N/A'}
                  delta={fmtDelta(currentSnapshot?.spotifyFollowers, previousSnapshot?.spotifyFollowers)}
                />
                <SidebarStat
                  icon={<InstagramLogo size={12} weight="fill" className="text-[#E1306C]" />}
                  label="Instagram"
                  value={fmt(currentSnapshot?.instagramFollowers)}
                  delta={fmtDelta(currentSnapshot?.instagramFollowers, previousSnapshot?.instagramFollowers)}
                  dim={!currentSnapshot?.instagramFollowers}
                />
                <SidebarStat
                  icon={<TiktokLogo size={12} weight="fill" className="text-white" />}
                  label="TikTok"
                  value={fmt(currentSnapshot?.tiktokFollowers)}
                  delta={fmtDelta(currentSnapshot?.tiktokFollowers, previousSnapshot?.tiktokFollowers)}
                  dim={!currentSnapshot?.tiktokFollowers}
                />
                <SidebarStat
                  icon={<FacebookLogo size={12} weight="fill" className="text-[#1877F2]" />}
                  label="Facebook"
                  value={fmt(currentSnapshot?.facebookPageLikes)}
                  delta={fmtDelta(currentSnapshot?.facebookPageLikes, previousSnapshot?.facebookPageLikes)}
                  dim={!currentSnapshot?.facebookPageLikes}
                />

                {currentSnapshot?.snapshotAt && (
                  <p className="text-[9px] text-cyber-text-dim/50 font-mono pt-1 border-t border-cyber-border/50">
                    Updated {new Date(currentSnapshot.snapshotAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
                {!previousSnapshot && (
                  <p className="text-[9px] text-cyber-text-dim/50 font-mono">Search again for trend deltas</p>
                )}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-2">

              {/* Tab Bar */}
              <div className="flex gap-1 border-b border-cyber-border pb-0">
                {(['overview', 'communities', 'shows', 'agency'] as TabId[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-[11px] font-heading uppercase tracking-wide transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'border-cyber-cyan text-cyber-cyan'
                        : 'border-transparent text-cyber-text-dim hover:text-cyber-text-secondary'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* ── Overview Tab ── */}
              {activeTab === 'overview' && (
                <div className="space-y-2">

                  {/* Row 1: Social Growth + Platform Comparison */}
                  <div className="grid grid-cols-2 gap-2">

                    {/* Social Growth AreaChart */}
                    <div className="cyber-card p-3">
                      <p className="text-[10px] font-heading uppercase tracking-widest text-cyber-text-dim mb-2">
                        Social Growth
                        <span className="ml-1 text-cyber-text-dim/50 normal-case tracking-normal">
                          {snapshotHistory.length > 1 ? `(${snapshotHistory.length} snapshots)` : '(search again to build history)'}
                        </span>
                      </p>
                      {snapshotHistory.length > 1 ? (
                        <ResponsiveContainer width="100%" height={120}>
                          <AreaChart data={snapshotHistory.map(s => ({
                            date: new Date(s.snapshotAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            YouTube: s.youtubeSubscribers,
                            Instagram: s.instagramFollowers,
                            TikTok: s.tiktokFollowers,
                          }))}>
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false}
                              tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                            <Tooltip
                              contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 10 }}
                              formatter={(v: any) => fmt(v)}
                            />
                            <Area type="monotone" dataKey="YouTube" stroke="#ff0000" fill="#ff000015" strokeWidth={1.5} dot={false} />
                            <Area type="monotone" dataKey="Instagram" stroke="#E1306C" fill="#E1306C15" strokeWidth={1.5} dot={false} />
                            <Area type="monotone" dataKey="TikTok" stroke="#ffffff" fill="#ffffff10" strokeWidth={1.5} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[120px] flex items-center justify-center">
                          <p className="text-[10px] text-cyber-text-dim/50">No history yet — search again to track growth</p>
                        </div>
                      )}
                    </div>

                    {/* Platform Comparison BarChart */}
                    <div className="cyber-card p-3">
                      <p className="text-[10px] font-heading uppercase tracking-widest text-cyber-text-dim mb-2">Platform Comparison</p>
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart
                          data={[
                            { platform: 'YouTube', value: currentSnapshot?.youtubeSubscribers ?? youtubeChannel?.subscribers ?? 0, color: '#ff0000' },
                            { platform: 'Spotify',   value: currentSnapshot?.spotifyFollowers ?? selectedArtist.followers ?? 0,     color: '#1DB954' },
                            { platform: 'Instagram', value: currentSnapshot?.instagramFollowers ?? 0,  color: '#E1306C' },
                            { platform: 'TikTok',    value: currentSnapshot?.tiktokFollowers ?? 0,     color: '#ffffff' },
                            { platform: 'Facebook',  value: currentSnapshot?.facebookPageLikes ?? 0,   color: '#1877F2' },
                          ]}
                          layout="vertical"
                          margin={{ left: 4 }}
                        >
                          <XAxis type="number" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false}
                            tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                          <YAxis type="category" dataKey="platform" tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} width={52} />
                          <Tooltip
                            contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 10 }}
                            formatter={(v: any) => fmt(v)}
                          />
                          <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                            {[{ color: '#ff0000' }, { color: '#1DB954' }, { color: '#E1306C' }, { color: '#ffffff' }, { color: '#1877F2' }]
                              .map((entry, idx) => <Cell key={idx} fill={entry.color} fillOpacity={0.7} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Row 2: Reddit Sentiment + Quick Stats */}
                  <div className="grid grid-cols-2 gap-2">

                    {/* Reddit Sentiment Donut */}
                    <div className="cyber-card p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-heading uppercase tracking-widest text-cyber-text-dim">Reddit Mentions</p>
                        <FetchButton onClick={handleFetchReddit} loading={redditLoading} done={redditFetched} />
                      </div>
                      {redditLoading && <LoadingBar />}
                      {redditFetched && !redditLoading && (
                        redditSentiment.total > 0 ? (
                          <div className="flex items-center gap-3">
                            <PieChart width={80} height={80}>
                              <Pie data={[
                                { name: 'Positive', value: redditSentiment.positive, color: '#22c55e' },
                                { name: 'Negative', value: redditSentiment.negative, color: '#ef4444' },
                                { name: 'Neutral',  value: redditSentiment.neutral,  color: '#6b7280' },
                              ]} cx={35} cy={35} innerRadius={20} outerRadius={35} dataKey="value">
                                {[{ color: '#22c55e' }, { color: '#ef4444' }, { color: '#6b7280' }].map((e, i) => (
                                  <Cell key={i} fill={e.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 10 }} />
                            </PieChart>
                            <div className="space-y-1 text-[10px] font-mono">
                              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22c55e]" /><span className="text-cyber-text-dim">Positive</span><span className="text-cyber-text-primary ml-1">{redditSentiment.positive}</span></div>
                              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /><span className="text-cyber-text-dim">Negative</span><span className="text-cyber-text-primary ml-1">{redditSentiment.negative}</span></div>
                              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6b7280]" /><span className="text-cyber-text-dim">Neutral</span><span className="text-cyber-text-primary ml-1">{redditSentiment.neutral}</span></div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-cyber-text-dim/50 mt-2">No Reddit mentions found</p>
                        )
                      )}
                      {!redditFetched && !redditLoading && (
                        <p className="text-[10px] text-cyber-text-dim/50 mt-2">Click Fetch for Reddit sentiment analysis</p>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="cyber-card p-3">
                      <p className="text-[10px] font-heading uppercase tracking-widest text-cyber-text-dim mb-2">Quick Stats</p>
                      <div className="space-y-2">
                        {selectedArtist.popularity != null && (
                          <div>
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className="text-cyber-text-dim">Spotify Popularity</span>
                              <span className="text-cyber-text-primary font-mono">{selectedArtist.popularity}/100</span>
                            </div>
                            <div className="h-1 bg-cyber-bg-tertiary rounded-full overflow-hidden">
                              <div className="h-full bg-[#1DB954] rounded-full" style={{ width: `${selectedArtist.popularity}%` }} />
                            </div>
                          </div>
                        )}
                        {(currentSnapshot?.youtubeViews || youtubeChannel?.views) && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-cyber-text-dim">YouTube Total Views</span>
                            <span className="text-cyber-text-primary font-mono">
                              {fmt(parseInt(currentSnapshot?.youtubeViews || youtubeChannel?.views || '0', 10))}
                            </span>
                          </div>
                        )}
                        {currentSnapshot?.tiktokLikes != null && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-cyber-text-dim">TikTok Total Likes</span>
                            <span className="text-cyber-text-primary font-mono">{fmt(currentSnapshot.tiktokLikes)}</span>
                          </div>
                        )}
                        {redditFetched && redditSentiment.total > 0 && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-cyber-text-dim">Reddit Mentions</span>
                            <span className={`font-mono ${redditSentiment.score > 0 ? 'text-cyber-green' : redditSentiment.score < 0 ? 'text-cyber-red' : 'text-cyber-text-dim'}`}>
                              {redditSentiment.total} ({redditSentiment.score > 0 ? '+' : ''}{redditSentiment.score} sentiment)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reddit Post List (below charts, collapsed by default) */}
                  {redditMentions.length > 0 && (
                    <div className="cyber-card p-3">
                      <p className="text-[10px] font-heading uppercase tracking-widest text-cyber-text-dim mb-2">
                        Reddit Posts ({redditMentions.length})
                      </p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {redditMentions.map((m, i) => (
                          <div key={i} className="flex items-start gap-2 px-2 py-1.5 bg-cyber-bg-primary/60 rounded border border-cyber-border/50">
                            <div className="flex-1 min-w-0">
                              <a href={m.url} target="_blank" rel="noopener noreferrer"
                                className="text-[11px] text-cyber-cyan hover:text-cyber-cyan/80 line-clamp-1 flex items-center gap-1">
                                {m.title} <ArrowSquareOut size={10} className="flex-shrink-0" />
                              </a>
                              <div className="flex gap-2 mt-0.5 text-[9px] text-cyber-text-dim font-mono">
                                <span>r/{m.subreddit}</span>
                                <span>↑{m.upvotes}</span>
                                <span>💬{m.comments}</span>
                              </div>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                              m.sentiment === 'positive' ? 'bg-cyber-green/15 text-cyber-green' :
                              m.sentiment === 'negative' ? 'bg-cyber-red/15 text-cyber-red' :
                              'bg-cyber-bg-tertiary text-cyber-text-dim'
                            }`}>{m.sentiment}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Communities Tab ── */}
              {activeTab === 'communities' && (
                <div className="cyber-card p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-[11px] font-heading uppercase tracking-widest text-cyber-text-dim">Fan Communities</h3>
                      <p className="text-[10px] text-cyber-text-dim/70 mt-0.5">Facebook & Instagram fan groups in Asia</p>
                    </div>
                    <FetchButton onClick={handleFetchCommunities} loading={communitiesLoading} done={communities.length > 0 || !!communitiesError} />
                  </div>

                  {communitiesLoading && (
                    <div className="space-y-2 mb-3">
                      {['Instagram', 'Facebook', 'TikTok'].map(platform => (
                        <div key={platform} className="flex items-center gap-2 text-xs text-cyber-text-dim">
                          <Spinner size={11} className="animate-spin" />
                          <span>Searching {platform}...</span>
                        </div>
                      ))}
                      <p className="text-[10px] text-cyber-yellow">3 agents running in parallel (30–60s)</p>
                    </div>
                  )}

                  {communitiesError && <p className="text-xs text-cyber-red">{communitiesError}</p>}

                  {communities.length > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] text-cyber-text-dim font-mono">
                          Found <span className="text-cyber-green font-medium">{communities.length}</span> communities
                        </p>
                        <button onClick={() => setCommunityListOpen(o => !o)}
                          className="text-[10px] text-cyber-cyan flex items-center gap-1">
                          {communityListOpen ? <CaretDown size={10} /> : <CaretRight size={10} />}
                          {communityListOpen ? 'Collapse' : 'Expand'}
                        </button>
                      </div>
                      {communityListOpen && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {communities.map((c, i) => (
                            <div key={i} className="flex items-center justify-between px-2.5 py-2 bg-cyber-bg-primary/60 rounded border border-cyber-border/50">
                              <div className="flex items-center gap-2 min-w-0">
                                {c.platform === 'instagram' || c.platform === 'Instagram'
                                  ? <InstagramLogo size={13} className="text-[#E1306C] flex-shrink-0" />
                                  : c.platform === 'tiktok' || c.platform === 'TikTok'
                                    ? <TiktokLogo size={13} className="text-white flex-shrink-0" />
                                    : <FacebookLogo size={13} className="text-[#1877F2] flex-shrink-0" />}
                                <div className="min-w-0">
                                  <p className="text-xs text-cyber-text-primary truncate">{c.name}</p>
                                  {c.followers != null && <p className="text-[9px] text-cyber-text-dim font-mono">{fmt(c.followers)} members</p>}
                                </div>
                              </div>
                              {c.url && (
                                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:text-cyber-cyan/80 flex-shrink-0 ml-2">
                                  <ArrowSquareOut size={12} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {!communitiesLoading && communities.length === 0 && !communitiesError && (
                    <p className="text-[11px] text-cyber-text-dim">Click Fetch to search for fan communities in Asia</p>
                  )}
                </div>
              )}

              {/* ── Shows Tab ── */}
              {activeTab === 'shows' && (
                <div className="cyber-card p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-[11px] font-heading uppercase tracking-widest text-cyber-text-dim">Previous Shows</h3>
                      <p className="text-[10px] text-cyber-text-dim/70 mt-0.5">10 most recent performances</p>
                    </div>
                    <FetchButton onClick={handleFetchShows} loading={showsLoading} done={shows.length > 0 || !!showsError} />
                  </div>

                  {showsLoading && <LoadingBar />}
                  {showsError && !showsLoading && <p className="text-xs text-cyber-text-dim">{showsError}</p>}

                  {shows.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-cyber-border text-cyber-text-dim">
                            <th className="text-left py-1.5 px-2 font-heading text-[10px] uppercase tracking-wider w-6">#</th>
                            <th className="text-left py-1.5 px-2 font-heading text-[10px] uppercase tracking-wider">Date</th>
                            <th className="text-left py-1.5 px-2 font-heading text-[10px] uppercase tracking-wider">Venue</th>
                            <th className="text-left py-1.5 px-2 font-heading text-[10px] uppercase tracking-wider">Type</th>
                            <th className="text-left py-1.5 px-2 font-heading text-[10px] uppercase tracking-wider">Capacity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shows.map((show, i) => (
                            <tr key={show.id} className="border-b border-cyber-border/40 hover:bg-cyber-bg-tertiary/20">
                              <td className="py-1.5 px-2 text-cyber-text-dim font-mono">{i + 1}</td>
                              <td className="py-1.5 px-2 font-mono text-cyber-text-secondary whitespace-nowrap">
                                {show.eventDate ? new Date(show.eventDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                              </td>
                              <td className="py-1.5 px-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-cyber-text-primary">{show.venueName || '—'}</span>
                                  {show.venueCity && <span className="text-cyber-text-dim">{show.venueCity}{show.venueCountry ? `, ${show.venueCountry}` : ''}</span>}
                                  {show.sourceUrl && (
                                    <a href={show.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-cyber-cyan/50 hover:text-cyber-cyan ml-1">
                                      <ArrowSquareOut size={10} />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="py-1.5 px-2">{showTypeBadge(show.showType)}</td>
                              <td className="py-1.5 px-2">
                                {editingShowId === show.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={editingCapacity}
                                      onChange={e => setEditingCapacity(e.target.value)}
                                      className="w-20 px-1.5 py-0.5 bg-cyber-bg-secondary border border-cyber-cyan/50 rounded text-xs font-mono focus:outline-none"
                                      placeholder="e.g. 5000"
                                      autoFocus
                                    />
                                    <button onClick={() => handleSaveCapacity(show)} className="text-cyber-green hover:text-cyber-green/80"><Check size={12} /></button>
                                    <button onClick={() => setEditingShowId(null)} className="text-cyber-text-dim hover:text-cyber-red"><X size={12} /></button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-cyber-text-primary">
                                      {show.capacity != null ? show.capacity.toLocaleString() : <span className="text-cyber-text-dim">Unknown</span>}
                                    </span>
                                    <button
                                      onClick={() => { setEditingShowId(show.id); setEditingCapacity(show.capacity?.toString() || ''); }}
                                      className="text-cyber-text-dim hover:text-cyber-cyan opacity-60 hover:opacity-100 transition-opacity"
                                    >
                                      <PencilSimple size={11} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!showsLoading && shows.length === 0 && !showsError && (
                    <p className="text-[11px] text-cyber-text-dim">Click Fetch to load show history from Bandsintown</p>
                  )}
                </div>
              )}

              {/* ── Agency Tab ── */}
              {activeTab === 'agency' && (
                <div className="cyber-card p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-[11px] font-heading uppercase tracking-widest text-cyber-text-dim">Booking Agency</h3>
                      <p className="text-[10px] text-cyber-text-dim/70 mt-0.5">Who represents this artist</p>
                    </div>
                    <FetchButton onClick={handleFetchAgency} loading={agencyLoading} done={!!agencyData || !!agencyError} />
                  </div>

                  {agencyLoading && <LoadingBar />}
                  {agencyError && !agencyLoading && <p className="text-xs text-cyber-text-dim">{agencyError}</p>}

                  {agencyData && !agencyLoading && (
                    agencyData.agency ? (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyber-bg-tertiary flex items-center justify-center flex-shrink-0">
                          <Buildings size={20} className="text-cyber-cyan" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-cyber-text-primary">{agencyData.agency}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                              agencyData.confidence === 'high' ? 'text-cyber-green border-cyber-green/40 bg-cyber-green/10' :
                              agencyData.confidence === 'medium' ? 'text-cyber-yellow border-cyber-yellow/40 bg-cyber-yellow/10' :
                              'text-cyber-text-dim border-cyber-border'
                            }`}>
                              {agencyData.confidence} confidence
                            </span>
                            {agencyData.sourceUrl && (
                              <a href={agencyData.sourceUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-cyber-cyan hover:text-cyber-cyan/80 flex items-center gap-1">
                                View source <ArrowSquareOut size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-cyber-text-dim mb-2">Could not identify agency. Top results:</p>
                        {(agencyData.snippets || []).map((s: any, i: number) => (
                          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 py-1 text-xs text-cyber-cyan hover:text-cyber-cyan/80 truncate">
                            {s.title} <ArrowSquareOut size={10} className="flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    )
                  )}

                  {!agencyLoading && !agencyData && !agencyError && (
                    <p className="text-[11px] text-cyber-text-dim">Click Fetch to search for booking representation</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {searchResults.length === 0 && !selectedArtist && !loading && (
        <div className="text-center py-12">
          <MagnifyingGlass size={40} weight="duotone" className="text-cyber-text-dim mx-auto mb-3" />
          <p className="text-sm text-cyber-text-secondary">Search for an artist to begin research</p>
          <p className="text-xs text-cyber-text-dim mt-1">Pulls from Spotify, YouTube, Bandsintown and more</p>
        </div>
      )}
    </div>
  );
}

// ── Sub-Components ────────────────────────────────────────────────────────────

function SidebarStat({
  icon, label, value, delta, dim = false,
}: {
  icon: React.ReactNode; label: string; value: string; delta: number | null; dim?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${dim ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] text-cyber-text-dim">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-[11px] font-mono text-cyber-text-primary">{value}</span>
        {delta != null && (
          <div className={`flex items-center justify-end gap-0.5 text-[9px] font-mono ${
            delta > 0 ? 'text-cyber-green' : delta < 0 ? 'text-cyber-red' : 'text-cyber-text-dim'
          }`}>
            {delta > 0 ? <ArrowUp size={8} weight="bold" /> : delta < 0 ? <ArrowDown size={8} weight="bold" /> : <Minus size={8} />}
            {delta !== 0 ? `${delta > 0 ? '+' : ''}${Math.abs(delta) >= 1000 ? `${(Math.abs(delta)/1000).toFixed(1)}K` : Math.abs(delta)}` : '—'}
          </div>
        )}
      </div>
    </div>
  );
}

function FetchButton({ onClick, loading, done }: { onClick: () => void; loading: boolean; done: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-heading uppercase tracking-wide border transition-all ${
        done
          ? 'border-cyber-border text-cyber-text-dim hover:border-cyber-cyan/40 hover:text-cyber-cyan'
          : 'border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? <Spinner size={11} className="animate-spin" /> : null}
      {loading ? 'Fetching...' : done ? 'Re-fetch' : 'Fetch'}
    </button>
  );
}

function LoadingBar() {
  return (
    <div className="mb-2 w-full h-1 bg-cyber-bg-tertiary rounded-full overflow-hidden">
      <div className="h-full bg-cyber-cyan rounded-full animate-pulse" style={{ width: '60%' }} />
    </div>
  );
}
