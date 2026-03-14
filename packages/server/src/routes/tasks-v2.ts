import { FastifyPluginAsync } from 'fastify';
import { wsBroadcast } from '../utils/ws-broadcast.js';

const tasksV2Routes: FastifyPluginAsync = async (fastify) => {
  // Get all tasks (with filtering)
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { projectId, status, assignedAgent } = request.query as any;
    
    try {
      const where: any = {};
      if (projectId) where.projectId = projectId;
      if (status) where.status = status;
      if (assignedAgent) where.assignedAgent = assignedAgent;
      
      const tasks = await fastify.prisma.task.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true }
          },
          comments: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: [
          { status: 'asc' },
          { position: 'asc' },
          { createdAt: 'desc' }
        ]
      });
      
      return tasks;
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch tasks');
      reply.code(500).send({ error: 'Failed to fetch tasks' });
    }
  });
  
  // Get task by ID
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const task = await fastify.prisma.task.findUnique({
        where: { id },
        include: {
          project: true,
          comments: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
      
      if (!task) {
        return reply.code(404).send({ error: 'Task not found' });
      }
      
      return task;
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch task');
      reply.code(500).send({ error: 'Failed to fetch task' });
    }
  });
  
  // Create task
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { projectId, title, description, status, priority, assignedAgent, tags, dueAt } = request.body as any;
    
    if (!projectId || !title) {
      return reply.code(400).send({ error: 'projectId and title are required' });
    }
    
    try {
      const task = await fastify.prisma.task.create({
        data: {
          projectId,
          title,
          description,
          status: status || 'inbox',
          priority: priority || 'normal',
          assignedAgent,
          tags: tags ? JSON.stringify(tags) : '[]',
          dueAt: dueAt ? new Date(dueAt) : null,
        },
        include: {
          project: true,
          _count: { select: { comments: true } }
        }
      });
      
      // Log activity
      await fastify.prisma.activity.create({
        data: {
          type: 'task_created',
          taskId: task.id,
          projectId: task.projectId,
          agentId: assignedAgent || null,
          message: `Task created: ${title}`,
          metadata: JSON.stringify({ priority, status })
        }
      });

      wsBroadcast.broadcast('task_created', { task });

      return task;
    } catch (error) {
      fastify.log.error(error, 'Failed to create task');
      reply.code(500).send({ error: 'Failed to create task' });
    }
  });
  
  // Update task status
  fastify.patch('/:id/status', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    
    const validStatuses = ['inbox', 'assigned', 'active', 'review', 'waiting', 'blocked', 'done'];
    if (!validStatuses.includes(status)) {
      return reply.code(400).send({ error: 'Invalid status' });
    }
    
    try {
      const task = await fastify.prisma.task.update({
        where: { id },
        data: {
          status,
          completedAt: status === 'done' ? new Date() : null,
        },
        include: {
          project: true,
          _count: { select: { comments: true } }
        }
      });
      
      // Log activity
      await fastify.prisma.activity.create({
        data: {
          type: 'status_changed',
          taskId: task.id,
          projectId: task.projectId,
          agentId: task.assignedAgent || null,
          message: `Task status changed to: ${status}`,
          metadata: JSON.stringify({ oldStatus: null, newStatus: status })
        }
      });

      wsBroadcast.broadcast('task_status_changed', { task, newStatus: status });

      return task;
    } catch (error) {
      fastify.log.error(error, 'Failed to update task status');
      reply.code(500).send({ error: 'Failed to update task status' });
    }
  });
  
  // Update task
  fastify.patch('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const updates = request.body as any;
    
    try {
      const task = await fastify.prisma.task.update({
        where: { id },
        data: {
          ...updates,
          tags: updates.tags ? JSON.stringify(updates.tags) : undefined,
          dueAt: updates.dueAt ? new Date(updates.dueAt) : undefined,
        },
        include: {
          project: true,
          _count: { select: { comments: true } }
        }
      });
      
      // Log activity
      await fastify.prisma.activity.create({
        data: {
          type: 'task_updated',
          taskId: task.id,
          projectId: task.projectId,
          agentId: task.assignedAgent || null,
          message: `Task updated: ${task.title}`,
          metadata: JSON.stringify({ updates })
        }
      });

      wsBroadcast.broadcast('task_updated', { task });

      return task;
    } catch (error) {
      fastify.log.error(error, 'Failed to update task');
      reply.code(500).send({ error: 'Failed to update task' });
    }
  });
  
  // Delete task
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      await fastify.prisma.task.delete({
        where: { id }
      });

      wsBroadcast.broadcast('task_deleted', { taskId: id });

      return { success: true };
    } catch (error) {
      fastify.log.error(error, 'Failed to delete task');
      reply.code(500).send({ error: 'Failed to delete task' });
    }
  });
  
  // Add comment
  fastify.post('/:id/comments', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { content, agentId, mentions } = request.body as any;
    
    if (!content) {
      return reply.code(400).send({ error: 'content is required' });
    }
    
    try {
      const comment = await fastify.prisma.taskComment.create({
        data: {
          taskId: id,
          content,
          agentId: agentId || null,
          userId: (request.user as any)?.id || null,
          mentions: mentions ? JSON.stringify(mentions) : '[]',
        }
      });
      
      // Log activity
      const task = await fastify.prisma.task.findUnique({ where: { id } });
      await fastify.prisma.activity.create({
        data: {
          type: 'comment_added',
          taskId: id,
          projectId: task?.projectId || null,
          agentId: agentId || null,
          message: `Comment added to task`,
          metadata: JSON.stringify({ commentId: comment.id })
        }
      });
      
      return comment;
    } catch (error) {
      fastify.log.error(error, 'Failed to add comment');
      reply.code(500).send({ error: 'Failed to add comment' });
    }
  });
  
  // Get comments
  fastify.get('/:id/comments', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const comments = await fastify.prisma.taskComment.findMany({
        where: { taskId: id },
        orderBy: { createdAt: 'asc' }
      });
      
      return comments;
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch comments');
      reply.code(500).send({ error: 'Failed to fetch comments' });
    }
  });
};

export default tasksV2Routes;
