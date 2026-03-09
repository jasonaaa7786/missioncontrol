import { FastifyPluginAsync } from 'fastify';

const activityRoutes: FastifyPluginAsync = async (fastify) => {
  // Get activity feed
  fastify.get('/feed', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { type, agentId, taskId, projectId, limit = 50 } = request.query as any;
    
    try {
      const where: any = {};
      if (type) where.type = type;
      if (agentId) where.agentId = agentId;
      if (taskId) where.taskId = taskId;
      if (projectId) where.projectId = projectId;
      
      const activities = await fastify.prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
      });
      
      // Parse metadata JSON
      const activitiesWithParsedMetadata = activities.map(activity => ({
        ...activity,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
      }));
      
      return activitiesWithParsedMetadata;
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch activity feed');
      reply.code(500).send({ error: 'Failed to fetch activity feed' });
    }
  });
  
  // Log activity (for agents/scripts to post updates)
  fastify.post('/log', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { type, agentId, taskId, projectId, message, metadata } = request.body as any;
    
    if (!type || !message) {
      return reply.code(400).send({ error: 'type and message are required' });
    }
    
    try {
      const activity = await fastify.prisma.activity.create({
        data: {
          type,
          agentId: agentId || null,
          taskId: taskId || null,
          projectId: projectId || null,
          message,
          metadata: metadata ? JSON.stringify(metadata) : '{}'
        }
      });
      
      return activity;
    } catch (error) {
      fastify.log.error(error, 'Failed to log activity');
      reply.code(500).send({ error: 'Failed to log activity' });
    }
  });
  
  // Get activity stats
  fastify.get('/stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [total, todayCount, byType] = await Promise.all([
        fastify.prisma.activity.count(),
        fastify.prisma.activity.count({
          where: {
            createdAt: { gte: today }
          }
        }),
        fastify.prisma.activity.groupBy({
          by: ['type'],
          _count: true,
          where: {
            createdAt: { gte: today }
          }
        })
      ]);
      
      return {
        total,
        today: todayCount,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch activity stats');
      reply.code(500).send({ error: 'Failed to fetch activity stats' });
    }
  });
};

export default activityRoutes;
