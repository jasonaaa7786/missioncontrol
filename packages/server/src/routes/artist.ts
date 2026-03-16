import { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeArtistName(name: string): string {
  return name.toLowerCase().trim();
}

/** Infer show type from venue/event name and capacity */
function inferShowType(venueName: string, capacity?: number): string {
  const v = venueName.toLowerCase();
  if (v.includes('festival') || v.includes('fest ') || v.includes(' fest')) return 'festival';
  if (v.includes('stadium')) return 'stadium';
  if (v.includes('arena')) return 'arena';
  if (v.includes('hall') || v.includes('live house') || v.includes('theatre') || v.includes('theater')) return 'live_house';
  if (capacity) {
    if (capacity >= 15000) return 'stadium';
    if (capacity >= 5000) return 'arena';
    if (capacity >= 2000) return 'live_house';
    return 'club';
  }
  return 'unknown';
}

/** Known agency patterns to detect from search snippets */
const AGENCY_PATTERNS = [
  { name: 'WME (William Morris Endeavor)', keywords: ['wme', 'william morris endeavor', 'williammorris'] },
  { name: 'CAA (Creative Artists Agency)', keywords: ['caa', 'creative artists agency'] },
  { name: 'UTA (United Talent Agency)', keywords: ['uta', 'united talent agency'] },
  { name: 'Paradigm Talent Agency', keywords: ['paradigm talent'] },
  { name: 'ICM Partners', keywords: ['icm partners', 'icm '] },
  { name: 'Live Nation / C3 Presents', keywords: ['live nation', 'c3 presents'] },
  { name: 'AEG Presents', keywords: ['aeg presents', 'aeg live'] },
  { name: 'Armada Music', keywords: ['armada music'] },
  { name: 'Insomniac', keywords: ['insomniac events'] },
  { name: 'Sony Music', keywords: ['sony music', 'columbia records'] },
  { name: 'Universal Music', keywords: ['universal music', 'def jam', 'republic records'] },
  { name: 'Warner Music', keywords: ['warner music', 'atlantic records', 'warner bros records'] },
];

function detectAgencyFromText(text: string): { name: string; confidence: string } | null {
  const lower = text.toLowerCase();
  for (const agency of AGENCY_PATTERNS) {
    if (agency.keywords.some(k => lower.includes(k))) {
      return { name: agency.name, confidence: 'high' };
    }
  }
  // Generic booking agent pattern
  const bookingMatch = text.match(/booked?\s+(?:by|through|via)\s+([A-Z][A-Za-z\s&']+(?:Agency|Management|Music|Entertainment|Presents|Records)?)/);
  if (bookingMatch) {
    return { name: bookingMatch[1].trim(), confidence: 'medium' };
  }
  return null;
}

// ── Routes ──────────────────────────────────────────────────────────────────

const artistRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = (fastify as any).prisma as PrismaClient;

  // ── POST /api/artist/search
  // Unified artist lookup: Spotify + YouTube, saves snapshot, returns delta
  fastify.post<{
    Body: { artistName: string };
  }>('/search', async (request, reply) => {
    const { artistName } = request.body;
    if (!artistName?.trim()) {
      return reply.code(400).send({ error: 'artistName is required' });
    }

    const normalized = normalizeArtistName(artistName);

    // Get the previous snapshot before this fetch
    const previousSnapshot = await (prisma as any).artistSnapshot.findFirst({
      where: { artistName: normalized },
      orderBy: { snapshotAt: 'desc' },
    }).catch(() => null);

    // Spotify + YouTube in parallel
    const [spotifyResult, youtubeResult] = await Promise.allSettled([
      // Spotify search
      (async () => {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        if (!clientId || !clientSecret) return null;

        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        });
        const tokenData: any = await tokenRes.json();
        if (!tokenData.access_token) return null;

        const searchRes = await fetch(
          `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(artistName)}&limit=1`,
          { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
        );
        const searchData: any = await searchRes.json();
        const artist = searchData.artists?.items?.[0];
        if (!artist) return null;
        return {
          spotifyId: artist.id,
          name: artist.name,
          imageUrl: artist.images?.[0]?.url || null,
          followers: artist.followers?.total || 0,
          popularity: artist.popularity || 0,
          genres: artist.genres || [],
          externalUrl: artist.external_urls?.spotify || null,
        };
      })(),
      // YouTube search
      (async () => {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) return null;
        const searchRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(artistName)}&maxResults=1&key=${apiKey}`
        );
        const searchData: any = await searchRes.json();
        const channel = searchData.items?.[0];
        if (!channel) return null;

        // Fetch channel stats
        const channelId = channel.id.channelId;
        const statsRes = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
        );
        const statsData: any = await statsRes.json();
        const ch = statsData.items?.[0];
        if (!ch) return null;
        return {
          channelId,
          title: ch.snippet.title,
          thumbnails: ch.snippet.thumbnails,
          subscribers: parseInt(ch.statistics.subscriberCount || '0', 10),
          views: ch.statistics.viewCount || '0',
        };
      })(),
    ]);

    const spotify = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null;
    const youtube = youtubeResult.status === 'fulfilled' ? youtubeResult.value : null;

    // Save new snapshot
    const snapshotData = {
      artistName: normalized,
      spotifyId: spotify?.spotifyId || null,
      youtubeChannelId: youtube?.channelId || null,
      imageUrl: spotify?.imageUrl || youtube?.thumbnails?.high?.url || null,
      spotifyFollowers: spotify?.followers || null,
      spotifyPopularity: spotify?.popularity || null,
      youtubeSubscribers: youtube?.subscribers || null,
      youtubeViews: youtube?.views || null,
    };

    const newSnapshot = await (prisma as any).artistSnapshot.create({
      data: snapshotData,
    }).catch((err: any) => {
      fastify.log.error(err, 'Failed to save artist snapshot');
      return null;
    });

    return {
      artist: spotify || {
        name: artistName,
        imageUrl: youtube?.thumbnails?.high?.url || null,
        followers: null,
        popularity: null,
        genres: [],
      },
      youtubeChannel: youtube,
      socialSnapshot: newSnapshot,
      previousSnapshot: previousSnapshot,
    };
  });

  // ── GET /api/artist/:artistName/communities
  fastify.get<{
    Params: { artistName: string };
  }>('/:artistName/communities', async (request, reply) => {
    const { artistName } = request.params;
    const apifyKey = process.env.APIFY_API_KEY;

    if (!apifyKey) {
      return reply.code(503).send({
        error: 'Apify API key not configured. Set APIFY_API_KEY in .env to enable community search.',
        communities: [],
      });
    }

    const searchTerms = [
      `${artistName} fan club`,
      `${artistName} malaysia`,
      `${artistName} indonesia`,
      `${artistName} singapore`,
      `${artistName} thailand`,
    ];

    try {
      // Run Apify Instagram search
      const igRunRes = await fetch(
        'https://api.apify.com/v2/acts/apify~instagram-search-scraper/runs?waitForFinish=60',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apifyKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            searchType: 'hashtag',
            query: searchTerms.slice(0, 3).join(' '),
            resultsLimit: 20,
          }),
        }
      );

      if (!igRunRes.ok) throw new Error(`Apify run failed: ${igRunRes.status}`);
      const igRun: any = await igRunRes.json();
      const datasetId = igRun.data?.defaultDatasetId;

      if (!datasetId) return { communities: [] };

      const dataRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?limit=20`,
        { headers: { Authorization: `Bearer ${apifyKey}` } }
      );
      const items = (await dataRes.json()) as any[];

      const communities = items
        .filter((item: any) => item.username || item.name || item.title)
        .map((item: any) => ({
          name: item.fullName || item.username || item.title || 'Unknown',
          handle: item.username || null,
          followers: item.followersCount || item.memberCount || null,
          url: item.url || (item.username ? `https://instagram.com/${item.username}` : null),
          platform: 'instagram',
          country: null,
        }))
        .slice(0, 15);

      return { communities, total: communities.length };
    } catch (err: any) {
      fastify.log.error(err, 'Community search failed');
      return reply.code(500).send({ error: 'Community search failed', communities: [] });
    }
  });

  // ── GET /api/artist/:artistName/shows
  fastify.get<{
    Params: { artistName: string };
  }>('/:artistName/shows', async (request, reply) => {
    const { artistName } = request.params;
    const normalized = normalizeArtistName(artistName);

    // Check for cached shows in DB (less than 7 days old)
    const existing = await (prisma as any).artistShow.findMany({
      where: {
        artistName: normalized,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { eventDate: 'desc' },
      take: 10,
    }).catch(() => []);

    if (existing.length > 0) {
      return { shows: existing, source: 'cache' };
    }

    // Try Bandsintown
    try {
      const btRes = await fetch(
        `https://rest.bandsintown.com/artists/${encodeURIComponent(artistName)}/events?app_id=mission-control&date=past&per_page=10`,
        { headers: { Accept: 'application/json' } }
      );

      if (btRes.ok) {
        const events = (await btRes.json()) as any[];

        if (Array.isArray(events) && events.length > 0) {
          const shows = [];
          for (const event of events.slice(0, 10)) {
            const venue = event.venue || {};
            const venueName = venue.name || 'Unknown Venue';
            const showType = inferShowType(venueName);
            const show = await (prisma as any).artistShow.upsert({
              where: { id: event.id?.toString() || `bt-${Date.now()}-${Math.random()}` },
              create: {
                id: event.id?.toString() || crypto.randomUUID(),
                artistName: normalized,
                eventDate: event.datetime ? new Date(event.datetime) : null,
                venueName,
                venueCity: venue.city || null,
                venueCountry: venue.country || null,
                showType,
                capacity: null,
                source: 'bandsintown',
                sourceUrl: event.url || null,
              },
              update: {},
            }).catch(async () => {
              return (prisma as any).artistShow.create({
                data: {
                  artistName: normalized,
                  eventDate: event.datetime ? new Date(event.datetime) : null,
                  venueName,
                  venueCity: venue.city || null,
                  venueCountry: venue.country || null,
                  showType,
                  capacity: null,
                  source: 'bandsintown',
                  sourceUrl: event.url || null,
                },
              });
            });
            shows.push(show);
          }
          return { shows, source: 'bandsintown' };
        }
      }
    } catch (err) {
      fastify.log.warn(err, 'Bandsintown failed, trying Brave Search');
    }

    // Fallback: Brave Search
    const braveKey = process.env.BRAVE_API_KEY;
    if (!braveKey) {
      return { shows: [], source: 'none', message: 'No show data found. Configure BRAVE_API_KEY for web search fallback.' };
    }

    try {
      const braveRes = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(`"${artistName}" concert performance venue 2024 2025 live show`)}&count=10`,
        { headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey } }
      );

      if (!braveRes.ok) throw new Error(`Brave search failed: ${braveRes.status}`);
      const braveData: any = await braveRes.json();
      const results = braveData.web?.results || [];

      const shows = [];
      for (const result of results.slice(0, 10)) {
        const show = await (prisma as any).artistShow.create({
          data: {
            artistName: normalized,
            venueName: result.title?.substring(0, 100) || 'Unknown Venue',
            showType: 'unknown',
            capacity: null,
            source: 'brave_search',
            sourceUrl: result.url || null,
          },
        });
        shows.push(show);
      }
      return { shows, source: 'brave_search' };
    } catch (err) {
      fastify.log.error(err, 'Brave search also failed');
      return { shows: [], source: 'none' };
    }
  });

  // ── PATCH /api/artist/:artistName/shows/:showId
  fastify.patch<{
    Params: { artistName: string; showId: string };
    Body: { capacity: number };
  }>('/:artistName/shows/:showId', async (request, reply) => {
    const { showId } = request.params;
    const { capacity } = request.body;

    if (typeof capacity !== 'number' || capacity < 0) {
      return reply.code(400).send({ error: 'capacity must be a non-negative number' });
    }

    try {
      const updated = await (prisma as any).artistShow.update({
        where: { id: showId },
        data: { capacity },
      });
      return updated;
    } catch (err) {
      return reply.code(404).send({ error: 'Show not found' });
    }
  });

  // ── GET /api/artist/:artistName/snapshots
  // Returns historical snapshots for the Social Growth chart
  fastify.get<{
    Params: { artistName: string };
  }>('/:artistName/snapshots', async (request, reply) => {
    const { artistName } = request.params;
    const normalized = normalizeArtistName(artistName);

    const snapshots = await (prisma as any).artistSnapshot.findMany({
      where: { artistName: normalized },
      orderBy: { snapshotAt: 'asc' },
      select: {
        snapshotAt: true,
        youtubeSubscribers: true,
        instagramFollowers: true,
        tiktokFollowers: true,
        facebookPageLikes: true,
        spotifyFollowers: true,
      },
    }).catch(() => []);

    return { snapshots };
  });

  // ── GET /api/artist/:artistName/reddit
  // Reddit mentions with keyword sentiment (free API, no Apify)
  fastify.get<{
    Params: { artistName: string };
  }>('/:artistName/reddit', async (request, reply) => {
    const { artistName } = request.params;

    const POSITIVE_WORDS = ['amazing', 'great', 'love', 'best', 'awesome', 'incredible', 'fire', 'legendary', 'excited', 'want', 'can\'t wait', 'hype', 'banger', 'goat', 'epic', 'fantastic', 'brilliant', 'perfect', 'genius'];
    const NEGATIVE_WORDS = ['bad', 'worst', 'hate', 'boring', 'disappointed', 'overrated', 'trash', 'garbage', 'terrible', 'awful', 'mediocre', 'disappointing', 'skip', 'avoid', 'meh'];

    function getSentiment(text: string): 'positive' | 'negative' | 'neutral' {
      const lower = text.toLowerCase();
      const posScore = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
      const negScore = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;
      if (posScore > negScore) return 'positive';
      if (negScore > posScore) return 'negative';
      return 'neutral';
    }

    try {
      // Use free Reddit JSON API — no auth needed
      const queries = [
        `${artistName} site:reddit.com`,
        `${artistName} subreddit:malaysia OR subreddit:singapore OR subreddit:indonesia OR subreddit:EDM OR subreddit:Trance`,
      ];

      const redditUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(artistName)}&limit=25&sort=new&t=year`;
      const res = await fetch(redditUrl, {
        headers: {
          'User-Agent': 'MissionControl/1.0 (artist-research)',
          'Accept': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Reddit API error: ${res.status}`);
      const data: any = await res.json();
      const posts = data?.data?.children || [];

      const mentions = posts
        .filter((p: any) => p.data?.title && p.data?.score >= 1)
        .slice(0, 20)
        .map((p: any) => {
          const post = p.data;
          const titleText = `${post.title} ${post.selftext || ''}`;
          return {
            title: post.title,
            url: `https://reddit.com${post.permalink}`,
            upvotes: post.score || 0,
            comments: post.num_comments || 0,
            subreddit: post.subreddit,
            date: new Date(post.created_utc * 1000).toISOString(),
            sentiment: getSentiment(titleText),
          };
        });

      const positive = mentions.filter((m: any) => m.sentiment === 'positive').length;
      const negative = mentions.filter((m: any) => m.sentiment === 'negative').length;
      const neutral = mentions.filter((m: any) => m.sentiment === 'neutral').length;

      return {
        mentions,
        sentiment: {
          score: positive - negative,
          total: mentions.length,
          positive,
          negative,
          neutral,
        },
      };
    } catch (err: any) {
      fastify.log.error(err, 'Reddit search failed');
      return {
        mentions: [],
        sentiment: { score: 0, total: 0, positive: 0, negative: 0, neutral: 0 },
        error: 'Reddit search temporarily unavailable',
      };
    }
  });

  // ── GET /api/artist/:artistName/agency
  fastify.get<{
    Params: { artistName: string };
  }>('/:artistName/agency', async (request, reply) => {
    const { artistName } = request.params;
    const braveKey = process.env.BRAVE_API_KEY;

    if (!braveKey) {
      return reply.code(503).send({
        error: 'BRAVE_API_KEY not configured',
        agency: null,
        confidence: 'none',
        sourceUrl: null,
      });
    }

    try {
      const query = `"${artistName}" booking agent agency representation WME CAA UTA management`;
      const braveRes = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
        { headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey } }
      );

      if (!braveRes.ok) throw new Error(`Brave search failed: ${braveRes.status}`);
      const data: any = await braveRes.json();
      const results = data.web?.results || [];

      // Search combined text from all results
      const fullText = results.map((r: any) => `${r.title} ${r.description || ''}`).join(' ');
      const detected = detectAgencyFromText(fullText);

      if (detected) {
        return {
          agency: detected.name,
          confidence: detected.confidence,
          sourceUrl: results[0]?.url || null,
          searchQuery: query,
        };
      }

      // Return raw snippets if no agency detected
      return {
        agency: null,
        confidence: 'none',
        sourceUrl: results[0]?.url || null,
        snippets: results.slice(0, 3).map((r: any) => ({ title: r.title, url: r.url })),
      };
    } catch (err: any) {
      fastify.log.error(err, 'Agency search failed');
      return reply.code(500).send({ error: 'Agency search failed' });
    }
  });
};

export default artistRoutes;
