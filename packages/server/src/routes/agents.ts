import { FastifyPluginAsync } from 'fastify';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const agentRoutes: FastifyPluginAsync = async (fastify) => {
  // Sync agents from OpenClaw config
  fastify.post('/sync', async (request, reply) => {
    try {
      const configPath = join(homedir(), '.openclaw', 'openclaw.json');
      const configData = await readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);

      // Filter: only HEYMACHA (ls-commander) and Livescape subagents
      const allowedAgents = [
        'ls-commander',     // HEYMACHA
        'livescape-scout',
        'livescape-pulse',
        'livescape-radar',
        'livescape-meta',
        'livescape-audit',
        'livescape-trends',
        'livescape-brand',
        'livescape-brain',
      ];

      const allAgents = config.agents?.list || [];
      const agents = allAgents.filter((agent: any) => allowedAgents.includes(agent.id));
      
      const synced = [];

      for (const agent of agents) {
        const existing = await fastify.prisma.agent.findUnique({
          where: { id: agent.id },
        });

        if (existing) {
          const updated = await fastify.prisma.agent.update({
            where: { id: agent.id },
            data: {
              name: agent.name || agent.id,
              workspace: agent.workspace || config.agents?.defaults?.workspace || '~/.openclaw/workspace',
              agentDir: agent.agentDir || null,
              model: agent.model || config.agents?.defaults?.model?.primary || null,
            },
          });
          synced.push(updated);
        } else {
          const created = await fastify.prisma.agent.create({
            data: {
              id: agent.id,
              name: agent.name || agent.id,
              workspace: agent.workspace || config.agents?.defaults?.workspace || '~/.openclaw/workspace',
              agentDir: agent.agentDir || null,
              model: agent.model || config.agents?.defaults?.model?.primary || null,
            },
          });
          synced.push(created);
        }
      }

      return { synced: synced.length, agents: synced };
    } catch (error) {
      fastify.log.error(error, 'Failed to sync agents from OpenClaw config');
      reply.code(500).send({ error: 'Failed to sync agents' });
    }
  });

  // List agents
  fastify.get('/', async (request, reply) => {
    const agents = await fastify.prisma.agent.findMany({
      orderBy: { name: 'asc' },
    });
    return agents;
  });

  // Get agent by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const agent = await fastify.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }

    return agent;
  });

  // Toggle agent active status
  fastify.patch('/:id/toggle', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const agent = await fastify.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }

    const updated = await fastify.prisma.agent.update({
      where: { id },
      data: { isActive: !agent.isActive },
    });

    return updated;
  });
};

export default agentRoutes;
