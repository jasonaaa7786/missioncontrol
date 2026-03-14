import { FastifyPluginAsync } from 'fastify';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const youtubeRoutes: FastifyPluginAsync = async (fastify) => {
  // Get YouTube channel statistics by channel ID
  fastify.get<{
    Params: { channelId: string };
  }>('/channel/:channelId', async (request, reply) => {
    const { channelId } = request.params;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return reply.code(500).send({ error: 'YouTube API key not configured' });
    }

    try {
      const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`;
      const { stdout } = await execAsync(`curl -s "${url}"`);
      const data = JSON.parse(stdout);

      if (!data.items || data.items.length === 0) {
        return reply.code(404).send({ error: 'Channel not found' });
      }

      const channel = data.items[0];
      
      return {
        channelId: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        publishedAt: channel.snippet.publishedAt,
        thumbnails: channel.snippet.thumbnails,
        country: channel.snippet.country,
        statistics: {
          subscriberCount: parseInt(channel.statistics.subscriberCount, 10),
          viewCount: parseInt(channel.statistics.viewCount, 10),
          videoCount: parseInt(channel.statistics.videoCount, 10),
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch YouTube channel data');
      return reply.code(500).send({ error: 'Failed to fetch YouTube channel data' });
    }
  });

  // Search for YouTube channels by name
  fastify.get<{
    Querystring: { q: string; maxResults?: string };
  }>('/search', async (request, reply) => {
    const { q, maxResults = '5' } = request.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      return reply.code(500).send({ error: 'YouTube API key not configured' });
    }

    if (!q) {
      return reply.code(400).send({ error: 'Query parameter "q" is required' });
    }

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(q)}&maxResults=${maxResults}&key=${apiKey}`;
      const { stdout } = await execAsync(`curl -s "${url}"`);
      const data = JSON.parse(stdout);

      if (!data.items) {
        return { channels: [] };
      }

      const channels = data.items.map((item: any) => ({
        channelId: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
      }));

      return { channels };
    } catch (error) {
      fastify.log.error(error, 'Failed to search YouTube channels');
      return reply.code(500).send({ error: 'Failed to search YouTube channels' });
    }
  });
};

export default youtubeRoutes;
