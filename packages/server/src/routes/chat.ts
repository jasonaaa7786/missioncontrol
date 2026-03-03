import { FastifyPluginAsync } from 'fastify';
import type { ChatRequest } from '@mc/shared';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  // Get or create chat session
  fastify.post('/session', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { projectId } = request.body as { projectId?: string };

    const session = await fastify.prisma.chatSession.create({
      data: {
        projectId: projectId || null,
      },
    });

    return session;
  });

  // Get chat history
  fastify.get('/session/:sessionId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };

    const messages = await fastify.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });

    return messages;
  });

  // Send message
  fastify.post('/message', { preHandler: [fastify.authenticate] }, async (request, reply) => {
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

    // Send to OpenClaw ls-commander agent (HEYMACHA)
    let response = '[No response from HEYMACHA]';
    try {
      const command = `cd /root/livescape-marketing/ls-commander && openclaw chat --agent=ls-commander --message="${body.message.replace(/"/g, '\\"')}" --profile=livescape --timeout=30`;
      const { stdout, stderr } = await execAsync(command, {
        timeout: 35000,
        maxBuffer: 1024 * 1024 * 10, // 10MB
      });
      
      if (stderr) {
        fastify.log.warn({ stderr }, 'OpenClaw stderr output');
      }
      
      if (stdout.trim()) {
        response = stdout.trim();
      }
    } catch (err: any) {
      fastify.log.error(err, 'Failed to send message to OpenClaw');
      response = `Error communicating with HEYMACHA: ${err.message}`;
    }

    // Save assistant response
    const assistantMessage = await fastify.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: response,
      },
    });

    return {
      sessionId,
      response,
      userMessage,
      assistantMessage,
    };
  });

  // Delete chat session
  fastify.delete('/session/:sessionId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    
    await fastify.prisma.chatSession.delete({
      where: { id: sessionId },
    });

    reply.code(204).send();
  });
};

export default chatRoutes;
