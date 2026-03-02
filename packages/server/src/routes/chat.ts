import { FastifyPluginAsync } from 'fastify';
import type { ChatRequest } from '@mc/shared';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  // Get or create chat session
  fastify.post('/session', async (request, reply) => {
    const { projectId } = request.body as { projectId?: string };

    const session = await fastify.prisma.chatSession.create({
      data: {
        projectId: projectId || null,
      },
    });

    return session;
  });

  // Get chat history
  fastify.get('/session/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    const messages = await fastify.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    return messages;
  });

  // Send message
  fastify.post('/message', async (request, reply) => {
    const body = request.body as ChatRequest;

    // Create session if not provided
    let sessionId = body.sessionId;
    if (!sessionId) {
      const session = await fastify.prisma.chatSession.create({
        data: { projectId: body.projectId || null },
      });
      sessionId = session.id;
    }

    // Save user message
    const userMessage = await fastify.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: body.message,
      },
    });

    // TODO: Integrate with OpenClaw agent for actual response
    // For now, echo a placeholder response
    const assistantMessage = await fastify.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: `[Placeholder] Received: "${body.message}". OpenClaw integration pending.`,
      },
    });

    return {
      sessionId,
      userMessage,
      assistantMessage,
    };
  });

  // Delete chat session
  fastify.delete('/session/:sessionId', async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    
    await fastify.prisma.chatSession.delete({
      where: { id: sessionId },
    });

    reply.code(204).send();
  });
};

export default chatRoutes;
