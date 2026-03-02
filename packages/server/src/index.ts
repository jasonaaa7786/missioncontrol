import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireAdminMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import agentRoutes from './routes/agents.js';
import scheduleRoutes from './routes/schedules.js';
import chatRoutes from './routes/chat.js';
import fileRoutes from './routes/files.js';

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Plugins
await fastify.register(cors, {
  origin: true, // Allow all origins in dev (restrict in production)
});

await fastify.register(websocket);

// Attach Prisma to request context
fastify.decorate('prisma', prisma);

// Attach auth middleware
fastify.decorate('authenticate', authMiddleware);
fastify.decorate('requireAdmin', requireAdminMiddleware);

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(projectRoutes, { prefix: '/api/projects' });
await fastify.register(taskRoutes, { prefix: '/api/tasks' });
await fastify.register(agentRoutes, { prefix: '/api/agents' });
await fastify.register(scheduleRoutes, { prefix: '/api/schedules' });
await fastify.register(chatRoutes, { prefix: '/api/chat' });
await fastify.register(fileRoutes, { prefix: '/api/files' });

// WebSocket endpoint
fastify.get('/ws', { websocket: true }, (socket, req) => {
  socket.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      fastify.log.info({ data }, 'WebSocket message received');
      
      // Echo for now (will implement proper event handling)
      socket.send(JSON.stringify({ event: 'pong', data }));
    } catch (err) {
      fastify.log.error(err, 'WebSocket message parse error');
    }
  });

  socket.on('close', () => {
    fastify.log.info('WebSocket client disconnected');
  });
});

// Start server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const HOST = process.env.HOST || '0.0.0.0'; // LAN accessible by default

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`\n🚀 Mission Control Server running at http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔌 WebSocket: ws://${HOST}:${PORT}/ws\n`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

// Graceful shutdown
const shutdown = async () => {
  fastify.log.info('Shutting down gracefully...');
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
