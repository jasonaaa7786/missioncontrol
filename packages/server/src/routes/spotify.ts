import { FastifyPluginAsync } from 'fastify';

// In-memory token cache
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`Spotify auth failed: ${res.status}`);
  }

  const data: any = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken as string;
}

const spotifyRoutes: FastifyPluginAsync = async (fastify) => {
  // Search artists by name
  fastify.get<{
    Querystring: { q: string; limit?: string };
  }>('/search', async (request, reply) => {
    const { q, limit = '5' } = request.query;
    if (!q) return reply.code(400).send({ error: 'Query "q" is required' });

    try {
      const token = await getSpotifyToken();
      const url = `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(q)}&limit=${limit}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: any = await res.json();

      if (data.error) {
        return reply.code(data.error.status || 500).send({ error: data.error.message });
      }

      const artists = (data.artists?.items || []).map((a: any) => ({
        spotifyId: a.id,
        name: a.name,
        imageUrl: a.images?.[0]?.url || null,
        followers: a.followers?.total || 0,
        popularity: a.popularity || 0,
        genres: a.genres || [],
        externalUrl: a.external_urls?.spotify || null,
      }));

      return { artists };
    } catch (err: any) {
      fastify.log.error(err, 'Spotify search error');
      if (err.message.includes('not configured')) {
        return reply.code(503).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Spotify search failed' });
    }
  });

  // Get artist by Spotify ID
  fastify.get<{
    Params: { artistId: string };
  }>('/artist/:artistId', async (request, reply) => {
    const { artistId } = request.params;

    try {
      const token = await getSpotifyToken();
      const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: any = await res.json();

      if (data.error) {
        return reply.code(data.error.status || 500).send({ error: data.error.message });
      }

      return {
        spotifyId: data.id,
        name: data.name,
        imageUrl: data.images?.[0]?.url || null,
        followers: data.followers?.total || 0,
        popularity: data.popularity || 0,
        genres: data.genres || [],
        externalUrl: data.external_urls?.spotify || null,
      };
    } catch (err: any) {
      fastify.log.error(err, 'Spotify artist fetch error');
      if (err.message.includes('not configured')) {
        return reply.code(503).send({ error: err.message });
      }
      return reply.code(500).send({ error: 'Failed to fetch Spotify artist' });
    }
  });
};

export default spotifyRoutes;
