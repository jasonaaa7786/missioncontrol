import { useState } from 'react';
import { artist, spotify } from '../lib/api';
import {
  MagnifyingGlass, ArrowLeft, YoutubeLogo, SpotifyLogo,
  InstagramLogo, TiktokLogo, FacebookLogo,
  Users, ArrowUp, ArrowDown, Minus,
  Buildings, Ticket, UserFocus,
  ArrowSquareOut, PencilSimple, Check, X,
  Spinner, CaretDown, CaretRight,
} from '@phosphor-icons/react';

// ── Types ────────────────────────────────────────────────────────────────────

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
    stadium: { label: 'Stadium', color: 'text-cyber-red border-cyber-red/40 bg-cyber-red/10' },
    arena: { label: 'Arena', color: 'text-cyber-purple border-cyber-purple/40 bg-cyber-purple/10' },
    live_house: { label: 'Live House', color: 'text-cyber-green border-cyber-green/40 bg-cyber-green/10' },
    club: { label: 'Club', color: 'text-cyber-cyan border-cyber-cyan/40 bg-cyber-cyan/10' },
    unknown: { label: 'Unknown', color: 'text-cyber-text-dim border-cyber-border' },
  };
  const entry = map[type || 'unknown'] || map.unknown;
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${entry.color}`}>{entry.label}</span>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ArtistResearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArtistProfile[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<ArtistProfile | null>(null);
  const [currentSnapshot, setCurrentSnapshot] = useState<SocialSnapshot | null>(null);
  const [previousSnapshot, setPreviousSnapshot] = useState<SocialSnapshot | null>(null);
  const [youtubeChannel, setYoutubeChannel] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Communities state
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);
  const [communitiesExpanded, setCommunitiesExpanded] = useState(false);
  const [communityListOpen, setCommunityListOpen] = useState(true);

  // Shows state
  const [shows, setShows] = useState<Show[]>([]);
  const [showsLoading, setShowsLoading] = useState(false);
  const [showsError, setShowsError] = useState<string | null>(null);
  const [editingShowId, setEditingShowId] = useState<string | null>(null);
  const [editingCapacity, setEditingCapacity] = useState('');

  // Agency state
  const [agencyData, setAgencyData] = useState<any | null>(null);
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [agencyError, setAgencyError] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

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
        name: a.name,
        imageUrl: a.imageUrl,
        followers: a.followers,
        popularity: a.popularity,
        genres: a.genres,
        spotifyId: a.spotifyId,
        externalUrl: a.externalUrl || undefined,
      })));
    } catch (err: any) {
      // Fallback: try artist search directly
      try {
        const res = await artist.search(searchQuery);
        const a = res.artist;
        setSearchResults([{
          name: a.name, imageUrl: a.imageUrl, followers: a.followers,
          popularity: a.popularity, genres: a.genres || [],
          spotifyId: a.spotifyId, externalUrl: a.externalUrl,
        }]);
      } catch (err2: any) {
        setError(err2.message || 'Search failed. Check SPOTIFY_CLIENT_ID/SECRET and YOUTUBE_API_KEY environment variables.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArtist = async (profile: ArtistProfile) => {
    setLoading(true);
    setError(null);
    // Reset all sections
    setCommunities([]); setCommunitiesError(null);
    setShows([]); setShowsError(null);
    setAgencyData(null); setAgencyError(null);

    try {
      const res = await artist.search(profile.name);
      setSelectedArtist({ ...profile, ...res.artist });
      setYoutubeChannel(res.youtubeChannel);
      setCurrentSnapshot(res.socialSnapshot as SocialSnapshot);
      setPreviousSnapshot(res.previousSnapshot as SocialSnapshot);
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
      else { setCommunities(res.communities); setCommunitiesExpanded(true); }
    } catch (err: any) {
      setCommunitiesError(err.message || 'Community search failed');
    } finally {
      setCommunitiesLoading(false);
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
    if (isNaN(cap) || cap < 0) return;
    if (!selectedArtist) return;
    try {
      const updated = await artist.updateShowCapacity(selectedArtist.name, show.id, cap);
      setShows(prev => prev.map(s => s.id === show.id ? { ...s, capacity: updated.capacity } : s));
    } catch {}
    setEditingShowId(null);
    setEditingCapacity('');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3 fade-in-up">
      {/* Header + Search */}
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
            className="px-4 py-2 bg-cyber-cyan text-cyber-bg-primary rounded text-sm font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-heading"
          >
            {loading ? <Spinner size={14} className="animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-2.5 bg-cyber-red/10 border border-cyber-red/30 rounded text-cyber-red text-xs">{error}</div>
      )}

      {/* Search Results List */}
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

      {/* Artist Detail View */}
      {selectedArtist && (
        <div className="space-y-2.5">
          {/* Back */}
          <button
            onClick={() => { setSelectedArtist(null); setSearchResults([]); }}
            className="flex items-center gap-1.5 text-cyber-cyan text-xs hover:text-cyber-cyan/80 transition-colors"
          >
            <ArrowLeft size={12} weight="bold" /> Back to results
          </button>

          {/* ── Artist Profile Card ── */}
          <div className="cyber-card p-3">
            <div className="flex items-start gap-4">
              {selectedArtist.imageUrl
                ? <img src={selectedArtist.imageUrl} alt={selectedArtist.name} className="w-[80px] h-[80px] rounded-lg object-cover ring-2 ring-cyber-cyan/20 flex-shrink-0" />
                : <div className="w-[80px] h-[80px] rounded-lg bg-cyber-bg-tertiary flex items-center justify-center flex-shrink-0"><UserFocus size={36} className="text-cyber-text-dim" /></div>
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-lg font-heading text-cyber-text-primary leading-tight">{selectedArtist.name}</h2>
                  {selectedArtist.externalUrl && (
                    <a href={selectedArtist.externalUrl} target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:text-cyber-cyan/80 flex-shrink-0">
                      <ArrowSquareOut size={14} />
                    </a>
                  )}
                </div>
                {selectedArtist.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedArtist.genres.slice(0, 4).map(g => (
                      <span key={g} className="text-[10px] px-1.5 py-0.5 rounded border border-cyber-border text-cyber-text-dim">{g}</span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-cyber-text-dim font-mono">
                  {selectedArtist.followers != null && (
                    <span><span className="text-cyber-text-primary font-medium">{fmt(selectedArtist.followers)}</span> Spotify followers</span>
                  )}
                  {selectedArtist.popularity != null && (
                    <span>Popularity <span className="text-cyber-text-primary">{selectedArtist.popularity}/100</span></span>
                  )}
                  {youtubeChannel && (
                    <span><span className="text-cyber-text-primary">{fmt(youtubeChannel.subscribers)}</span> YT subs</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Social Snapshot ── */}
          <SectionCard title="Social Snapshot" subtitle={currentSnapshot?.snapshotAt ? `as of ${new Date(currentSnapshot.snapshotAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : undefined}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
              <StatCell
                icon={<YoutubeLogo size={14} weight="fill" className="text-[#ff0000]" />}
                platform="YouTube"
                value={fmt(currentSnapshot?.youtubeSubscribers ?? youtubeChannel?.subscribers)}
                label="subscribers"
                delta={fmtDelta(currentSnapshot?.youtubeSubscribers, previousSnapshot?.youtubeSubscribers)}
              />
              <StatCell
                icon={<SpotifyLogo size={14} weight="fill" className="text-[#1DB954]" />}
                platform="Spotify"
                value={fmt(currentSnapshot?.spotifyFollowers ?? selectedArtist.followers)}
                label="followers"
                delta={fmtDelta(currentSnapshot?.spotifyFollowers, previousSnapshot?.spotifyFollowers)}
              />
              <StatCell
                icon={<InstagramLogo size={14} weight="fill" className="text-[#E1306C]" />}
                platform="Instagram"
                value={fmt(currentSnapshot?.instagramFollowers)}
                label="followers"
                delta={fmtDelta(currentSnapshot?.instagramFollowers, previousSnapshot?.instagramFollowers)}
                dim={!currentSnapshot?.instagramFollowers}
              />
              <StatCell
                icon={<TiktokLogo size={14} weight="fill" className="text-white" />}
                platform="TikTok"
                value={fmt(currentSnapshot?.tiktokFollowers)}
                label="followers"
                delta={fmtDelta(currentSnapshot?.tiktokFollowers, previousSnapshot?.tiktokFollowers)}
                dim={!currentSnapshot?.tiktokFollowers}
              />
              <StatCell
                icon={<FacebookLogo size={14} weight="fill" className="text-[#1877F2]" />}
                platform="Facebook"
                value={fmt(currentSnapshot?.facebookPageLikes)}
                label="page likes"
                delta={fmtDelta(currentSnapshot?.facebookPageLikes, previousSnapshot?.facebookPageLikes)}
                dim={!currentSnapshot?.facebookPageLikes}
              />
            </div>
            {!previousSnapshot && (
              <p className="text-[10px] text-cyber-text-dim mt-2 font-mono">Search again to see 7-day trend deltas</p>
            )}
          </SectionCard>

          {/* ── Fan Communities ── */}
          <SectionCard
            title="Fan Communities"
            subtitle="Facebook & Instagram fan groups in Asia"
            action={
              <FetchButton
                onClick={handleFetchCommunities}
                loading={communitiesLoading}
                done={communities.length > 0 || !!communitiesError}
              />
            }
          >
            {communitiesLoading && <LoadingBar />}
            {communitiesError && (
              <p className="text-xs text-cyber-red mt-2">{communitiesError}</p>
            )}
            {communities.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] text-cyber-text-dim font-mono">
                    Found <span className="text-cyber-green font-medium">{communities.length}</span> communities
                  </p>
                  <button
                    onClick={() => setCommunityListOpen(o => !o)}
                    className="text-[10px] text-cyber-cyan hover:text-cyber-cyan/80 flex items-center gap-1"
                  >
                    {communityListOpen ? <CaretDown size={10} /> : <CaretRight size={10} />}
                    {communityListOpen ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                {communityListOpen && (
                  <div className="space-y-1">
                    {communities.map((c, i) => (
                      <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-cyber-bg-primary/60 rounded border border-cyber-border/50 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {c.platform === 'instagram' ? <InstagramLogo size={12} className="text-[#E1306C] flex-shrink-0" /> : <FacebookLogo size={12} className="text-[#1877F2] flex-shrink-0" />}
                          <span className="text-cyber-text-primary truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {c.followers != null && <span className="font-mono text-[10px] text-cyber-text-dim">{fmt(c.followers)} members</span>}
                          {c.url && (
                            <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:text-cyber-cyan/80">
                              <ArrowSquareOut size={11} />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!communitiesLoading && communities.length === 0 && !communitiesError && (
              <p className="text-[11px] text-cyber-text-dim mt-2">Click Fetch to search for fan communities</p>
            )}
          </SectionCard>

          {/* ── Previous Shows ── */}
          <SectionCard
            title="Previous Shows"
            subtitle="10 most recent performances"
            action={
              <FetchButton
                onClick={handleFetchShows}
                loading={showsLoading}
                done={shows.length > 0 || !!showsError}
              />
            }
          >
            {showsLoading && <LoadingBar />}
            {showsError && !showsLoading && (
              <p className="text-xs text-cyber-text-dim mt-2">{showsError}</p>
            )}
            {shows.length > 0 && (
              <div className="mt-2 overflow-x-auto">
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
                      <tr key={show.id} className="border-b border-cyber-border/40 hover:bg-cyber-bg-tertiary/20 transition-colors">
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
              <p className="text-[11px] text-cyber-text-dim mt-2">Click Fetch to load show history from Bandsintown</p>
            )}
          </SectionCard>

          {/* ── Booking Agency ── */}
          <SectionCard
            title="Booking Agency"
            subtitle="Who represents this artist"
            action={
              <FetchButton
                onClick={handleFetchAgency}
                loading={agencyLoading}
                done={!!agencyData || !!agencyError}
              />
            }
          >
            {agencyLoading && <LoadingBar />}
            {agencyError && !agencyLoading && (
              <p className="text-xs text-cyber-text-dim mt-2">{agencyError}</p>
            )}
            {agencyData && !agencyLoading && (
              <div className="mt-2">
                {agencyData.agency ? (
                  <div className="flex items-center justify-between">
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
                          <a href={agencyData.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyber-cyan hover:text-cyber-cyan/80 flex items-center gap-1">
                            View source <ArrowSquareOut size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-cyber-text-dim mb-2">Could not identify agency automatically. Top results:</p>
                    {(agencyData.snippets || []).map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 py-1 text-xs">
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-cyber-cyan hover:text-cyber-cyan/80 truncate flex items-center gap-1">
                          {s.title} <ArrowSquareOut size={10} className="flex-shrink-0" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!agencyLoading && !agencyData && !agencyError && (
              <p className="text-[11px] text-cyber-text-dim mt-2">Click Fetch to search for booking representation</p>
            )}
          </SectionCard>
        </div>
      )}

      {/* Empty State */}
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

function SectionCard({
  title, subtitle, action, children
}: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="cyber-card p-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-heading uppercase tracking-widest text-cyber-text-dim">{title}</h3>
          {subtitle && <p className="text-[10px] text-cyber-text-dim/70 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
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

function StatCell({
  icon, platform, value, label, delta, dim = false
}: {
  icon: React.ReactNode; platform: string; value: string; label: string; delta: number | null; dim?: boolean;
}) {
  return (
    <div className={`bg-cyber-bg-primary/60 border border-cyber-border rounded p-2.5 ${dim ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-cyber-text-dim font-heading uppercase tracking-wide">{platform}</span>
      </div>
      <p className={`text-base font-bold font-mono ${dim ? 'text-cyber-text-dim' : 'text-cyber-text-primary'}`}>{value}</p>
      <p className="text-[9px] text-cyber-text-dim mb-1">{label}</p>
      {delta != null ? (
        <div className={`flex items-center gap-0.5 text-[10px] font-mono ${delta > 0 ? 'text-cyber-green' : delta < 0 ? 'text-cyber-red' : 'text-cyber-text-dim'}`}>
          {delta > 0 ? <ArrowUp size={9} weight="bold" /> : delta < 0 ? <ArrowDown size={9} weight="bold" /> : <Minus size={9} />}
          {delta !== 0 ? `${delta > 0 ? '+' : ''}${fmt(Math.abs(delta))}/7d` : 'no change'}
        </div>
      ) : (
        <span className="text-[10px] text-cyber-text-dim/50 font-mono">—</span>
      )}
    </div>
  );
}

function LoadingBar() {
  return (
    <div className="mt-2 w-full h-1 bg-cyber-bg-tertiary rounded-full overflow-hidden">
      <div className="h-full bg-cyber-cyan rounded-full animate-pulse" style={{ width: '60%' }} />
    </div>
  );
}
