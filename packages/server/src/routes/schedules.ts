import { FastifyPluginAsync } from 'fastify';
import type { CreateScheduleRequest, UpdateScheduleRequest } from '@mc/shared';

const scheduleRoutes: FastifyPluginAsync = async (fastify) => {
  // List schedules
  fastify.get('/  ', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { projectId } = request.query as { projectId?: string };
    
    const schedules = await fastify.prisma.schedule.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return schedules;
  });

  // Get schedule by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const schedule = await fastify.prisma.schedule.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!schedule) {
      reply.code(404).send({ error: 'Schedule not found' });
      return;
    }

    return schedule;
  });

  // Create schedule
  fastify.post('/  ', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const body = request.body as CreateScheduleRequest;

    const schedule = await fastify.prisma.schedule.create({
      data: {
        name: body.name,
        cronExpr: body.cronExpr,
        timezone: body.timezone || 'UTC',
        agentId: body.agentId,
        message: body.message,
        projectId: body.projectId || null,
      },
    });

    reply.code(201).send(schedule);
  });

  // Update schedule
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateScheduleRequest;

    const schedule = await fastify.prisma.schedule.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.cronExpr && { cronExpr: body.cronExpr }),
        ...(body.timezone && { timezone: body.timezone }),
        ...(body.agentId && { agentId: body.agentId }),
        ...(body.message && { message: body.message }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
      },
    });

    return schedule;
  });

  // Delete schedule
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    await fastify.prisma.schedule.delete({
      where: { id },
    });

    reply.code(204).send();
  });

  // Toggle schedule enable/disable
  fastify.post('/:id/toggle', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const schedule = await fastify.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      reply.code(404).send({ error: 'Schedule not found' });
      return;
    }

    const updated = await fastify.prisma.schedule.update({
      where: { id },
      data: { enabled: !schedule.enabled },
    });

    return updated;
  });

  // Run schedule now
  fastify.post('/:id/run', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const schedule = await fastify.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      reply.code(404).send({ error: 'Schedule not found' });
      return;
    }

    // TODO: Integrate with OpenClaw CLI to trigger actual execution
    // For now, just update lastRunAt
    const updated = await fastify.prisma.schedule.update({
      where: { id },
      data: { lastRunAt: new Date() },
    });

    return { success: true, schedule: updated };
  });
};

export default scheduleRoutes;
