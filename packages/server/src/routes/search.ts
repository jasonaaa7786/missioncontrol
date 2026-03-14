import { FastifyPluginAsync } from 'fastify';

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  // Unified search across projects, tasks, and agents
  fastify.get<{
    Querystring: { q: string; type?: string; limit?: string };
  }>('/', async (request, reply) => {
    const { q, type = 'all', limit = '20' } = request.query;
    const maxResults = Math.min(parseInt(limit, 10) || 20, 100);

    if (!q || q.trim().length === 0) {
      return reply.code(400).send({ error: 'Query parameter "q" is required' });
    }

    const query = q.trim();

    try {
      const results: {
        projects: any[];
        tasks: any[];
        agents: any[];
      } = { projects: [], tasks: [], agents: [] };

      // Search projects (venues/campaigns live here)
      if (type === 'all' || type === 'venues' || type === 'campaigns') {
        results.projects = await fastify.prisma.project.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
              { tags: { contains: query } },
            ],
          },
          take: maxResults,
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: { select: { tasks: true } },
          },
        });
      }

      // Search tasks
      if (type === 'all' || type === 'artists' || type === 'venues' || type === 'campaigns') {
        results.tasks = await fastify.prisma.task.findMany({
          where: {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
              { tags: { contains: query } },
            ],
          },
          take: maxResults,
          orderBy: { updatedAt: 'desc' },
          include: {
            project: { select: { name: true } },
          },
        });
      }

      // Search agents
      if (type === 'all' || type === 'artists') {
        results.agents = await fastify.prisma.agent.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
              { skills: { contains: query } },
            ],
          },
          take: maxResults,
          orderBy: { updatedAt: 'desc' },
        });
      }

      const totalResults =
        results.projects.length + results.tasks.length + results.agents.length;

      return {
        query,
        type,
        totalResults,
        ...results,
      };
    } catch (error) {
      fastify.log.error(error, 'Search failed');
      return reply.code(500).send({ error: 'Search failed' });
    }
  });
};

export default searchRoutes;
