import { FastifyPluginAsync } from 'fastify';
import type { CreateProjectRequest, UpdateProjectRequest } from '@mc/shared';

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // List all projects (requires authentication)
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const projects = await fastify.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });
    return projects;
  });

  // Get project by ID (requires authentication)
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await fastify.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: [{ status: 'asc' }, { position: 'asc' }],
        },
        schedules: true,
        _count: {
          select: { files: true },
        },
      },
    });

    if (!project) {
      reply.code(404).send({ error: 'Project not found' });
      return;
    }

    return project;
  });

  // Create project (admin only)
  fastify.post('/', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const body = request.body as CreateProjectRequest;
    
    const project = await fastify.prisma.project.create({
      data: {
        name: body.name,
        description: body.description || null,
        tags: JSON.stringify(body.tags || []),
        workingDir: body.workingDir,
        outputDir: body.outputDir || null,
        defaultAgent: body.defaultAgent || null,
        gitRepo: body.gitRepo || null,
        cadence: body.cadence || null,
      },
    });

    reply.code(201).send(project);
  });

  // Update project (admin only)
  fastify.patch('/:id', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateProjectRequest;

    const project = await fastify.prisma.project.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.tags && { tags: JSON.stringify(body.tags) }),
        ...(body.workingDir && { workingDir: body.workingDir }),
        ...(body.outputDir !== undefined && { outputDir: body.outputDir }),
        ...(body.defaultAgent !== undefined && { defaultAgent: body.defaultAgent }),
        ...(body.gitRepo !== undefined && { gitRepo: body.gitRepo }),
        ...(body.cadence !== undefined && { cadence: body.cadence }),
      },
    });

    return project;
  });

  // Delete project (admin only)
  fastify.delete('/:id', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    await fastify.prisma.project.delete({
      where: { id },
    });

    reply.code(204).send();
  });

  // Get project stats (requires authentication)
  fastify.get('/:id/stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const stats = await fastify.prisma.task.groupBy({
      by: ['status'],
      where: { projectId: id },
      _count: true,
    });

    return stats.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);
  });
};

export default projectRoutes;
