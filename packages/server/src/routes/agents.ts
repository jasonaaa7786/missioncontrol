import { FastifyPluginAsync } from 'fastify';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { wsBroadcast } from '../utils/ws-broadcast.js';

const agentRoutes: FastifyPluginAsync = async (fastify) => {
  // Sync agents from OpenClaw config (admin only)
  fastify.post('/sync', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    try {
      // Read from Livescape profile (where HEYMACHA and subagents are configured)
      const configPath = join(homedir(), '.openclaw-livescape', 'openclaw.json');
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
        'livescape-forge',
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

  // List agents with enriched activity stats
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const agents = await fastify.prisma.agent.findMany({
      orderBy: { name: 'asc' },
    });

    // Enrich each agent with activity stats
    const enriched = await Promise.all(agents.map(async (agent) => {
      try {
        // Get last activity
        const lastActivity = await fastify.prisma.activity.findFirst({
          where: { agentId: agent.id },
          orderBy: { createdAt: 'desc' },
        });

        // Count runs
        const [startCount, completeCount] = await Promise.all([
          fastify.prisma.activity.count({
            where: { agentId: agent.id, type: 'agent_started' },
          }),
          fastify.prisma.activity.count({
            where: { agentId: agent.id, type: 'agent_completed' },
          }),
        ]);

        // Get total tokens/cost from metadata
        const completedActivities = await fastify.prisma.activity.findMany({
          where: { agentId: agent.id, type: 'agent_completed' },
          select: { metadata: true },
        });

        let totalTokens = 0;
        let totalCost = 0;
        for (const a of completedActivities) {
          try {
            const meta = JSON.parse(a.metadata || '{}');
            totalTokens += meta.tokens || 0;
            totalCost += meta.cost || 0;
          } catch { /* skip */ }
        }

        return {
          ...agent,
          lastActiveAt: lastActivity?.createdAt || null,
          runCount: startCount,
          completedCount: completeCount,
          successRate: startCount > 0 ? Math.round((completeCount / startCount) * 100) : 0,
          totalTokens,
          totalCost: Math.round(totalCost * 10000) / 10000,
        };
      } catch {
        return {
          ...agent,
          lastActiveAt: null,
          runCount: 0,
          completedCount: 0,
          successRate: 0,
          totalTokens: 0,
          totalCost: 0,
        };
      }
    }));

    return enriched;
  });

  // Get agent activity history
  fastify.get('/:id/activity', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { limit = '20' } = request.query as { limit?: string };

    const activities = await fastify.prisma.activity.findMany({
      where: { agentId: id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    return activities.map(a => ({
      ...a,
      metadata: a.metadata ? JSON.parse(a.metadata) : {},
    }));
  });

  // Get agent by ID (requires authentication)
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
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

  // Update agent profile (name, imageUrl) — admin only
  fastify.patch('/:id', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, imageUrl } = request.body as { name?: string; imageUrl?: string };

    const agent = await fastify.prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      reply.code(404).send({ error: 'Agent not found' });
      return;
    }

    const updated = await fastify.prisma.agent.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    wsBroadcast.broadcast('agent_updated', { agent: updated });

    return updated;
  });

  // Toggle agent active status (admin only)
  fastify.patch('/:id/toggle', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
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

    wsBroadcast.broadcast('agent_toggled', { agent: updated });

    return updated;
  });

  // ========== SUBAGENT ROUTES ==========

  // Create a new subagent (admin only)
  fastify.post('/subagents', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const { name, description, skills, soulContent, projectIds } = request.body as {
      name: string;
      description?: string;
      skills?: string[];
      soulContent?: string;
      projectIds?: string[];
    };

    if (!name) {
      reply.code(400).send({ error: 'Name is required' });
      return;
    }

    // Generate ID from name
    const id = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    // Check if ID already exists
    const existing = await fastify.prisma.agent.findUnique({
      where: { id },
    });

    if (existing) {
      reply.code(400).send({ error: 'Agent with this name already exists' });
      return;
    }

    const subagent = await fastify.prisma.agent.create({
      data: {
        id,
        name,
        workspace: '~/.openclaw-livescape/workspace',
        isSubagent: true,
        description: description || null,
        skills: JSON.stringify(skills || []),
        soulContent: soulContent || null,
        parentAgentId: 'ls-commander',
        projectIds: JSON.stringify(projectIds || []),
        isActive: true,
      },
    });

    return subagent;
  });

  // List subagents (requires authentication)
  fastify.get('/subagents', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const subagents = await fastify.prisma.agent.findMany({
      where: { isSubagent: true },
      orderBy: { name: 'asc' },
    });
    return subagents;
  });

  // Update subagent (admin only)
  fastify.patch('/subagents/:id', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name, description, skills, soulContent, projectIds, imageUrl } = request.body as {
      name?: string;
      description?: string;
      skills?: string[];
      soulContent?: string;
      projectIds?: string[];
      imageUrl?: string;
    };

    const agent = await fastify.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent || !agent.isSubagent) {
      reply.code(404).send({ error: 'Subagent not found' });
      return;
    }

    const updated = await fastify.prisma.agent.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(skills && { skills: JSON.stringify(skills) }),
        ...(soulContent !== undefined && { soulContent }),
        ...(projectIds && { projectIds: JSON.stringify(projectIds) }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    return updated;
  });

  // Delete subagent (admin only)
  fastify.delete('/subagents/:id', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const agent = await fastify.prisma.agent.findUnique({
      where: { id },
    });

    if (!agent || !agent.isSubagent) {
      reply.code(404).send({ error: 'Subagent not found' });
      return;
    }

    await fastify.prisma.agent.delete({
      where: { id },
    });

    return { success: true };
  });
};

export default agentRoutes;
