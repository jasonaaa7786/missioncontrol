import { FastifyPluginAsync } from 'fastify';
import type { CreateTaskRequest, UpdateTaskRequest } from '@mc/shared';

const taskRoutes: FastifyPluginAsync = async (fastify) => {
  // Get tasks by project
  fastify.get('/project/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    
    const tasks = await fastify.prisma.task.findMany({
      where: { projectId },
      orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
    });

    return tasks;
  });

  // Get task by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const task = await fastify.prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      reply.code(404).send({ error: 'Task not found' });
      return;
    }

    return task;
  });

  // Create task
  fastify.post('/project/:projectId', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const body = request.body as CreateTaskRequest;

    // Get max position for the target status
    const maxPosition = await fastify.prisma.task.aggregate({
      where: { projectId, status: body.status || 'backlog' },
      _max: { position: true },
    });

    const task = await fastify.prisma.task.create({
      data: {
        projectId,
        title: body.title,
        description: body.description || null,
        status: body.status || 'backlog',
        priority: body.priority || 'medium',
        assignedAgent: body.assignedAgent || null,
        position: (maxPosition._max.position || 0) + 1,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
      },
    });

    reply.code(201).send(task);
  });

  // Update task
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateTaskRequest;

    const task = await fastify.prisma.task.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.priority && { priority: body.priority }),
        ...(body.assignedAgent !== undefined && { assignedAgent: body.assignedAgent }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.dueAt !== undefined && { dueAt: body.dueAt ? new Date(body.dueAt) : null }),
        ...(body.status === 'done' && { completedAt: new Date() }),
      },
    });

    return task;
  });

  // Delete task
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    await fastify.prisma.task.delete({
      where: { id },
    });

    reply.code(204).send();
  });

  // Reorder tasks
  fastify.post('/reorder', async (request, reply) => {
    const { taskId, newStatus, newPosition } = request.body as {
      taskId: string;
      newStatus: string;
      newPosition: number;
    };

    // Update task status and position
    await fastify.prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        position: newPosition,
      },
    });

    reply.code(200).send({ success: true });
  });
};

export default taskRoutes;
