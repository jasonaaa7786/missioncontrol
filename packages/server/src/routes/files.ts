import { FastifyPluginAsync } from 'fastify';
import { readdir, stat, readFile } from 'fs/promises';
import { join, resolve } from 'path';

const fileRoutes: FastifyPluginAsync = async (fastify) => {
  // Whitelist of allowed base directories
  const ALLOWED_DIRECTORIES = [
    '/root/livescape-marketing/shared-data',
    '/root/livescape-marketing/ls-commander',
    '/root/livescape-marketing/livescape-scout',
    '/root/livescape-marketing/livescape-pulse',
    '/root/livescape-marketing/livescape-radar',
    '/root/livescape-marketing/livescape-meta',
    '/root/livescape-marketing/livescape-audit',
    '/root/livescape-marketing/livescape-trends',
    '/root/livescape-marketing/livescape-brand',
    '/root/livescape-marketing/livescape-brain',
    '/root/livescape-marketing/livescape-forge',
  ];

  /**
   * Validate that a path is within allowed directories
   */
  function isPathAllowed(requestedPath: string): boolean {
    try {
      // Resolve to absolute path (prevents .. attacks)
      const absolutePath = resolve(requestedPath);
      
      // Check if path starts with any allowed directory
      return ALLOWED_DIRECTORIES.some(allowedDir => 
        absolutePath.startsWith(resolve(allowedDir))
      );
    } catch {
      return false;
    }
  }

  // List files in project directory (requires authentication)
  fastify.get('/browse', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { path } = request.query as { path: string };

    if (!path) {
      reply.code(400).send({ error: 'Path parameter required' });
      return;
    }

    // Validate path is in allowed directories
    if (!isPathAllowed(path)) {
      fastify.log.warn({ path }, 'Attempted access to restricted path');
      reply.code(403).send({ error: 'Access to this path is not allowed' });
      return;
    }

    try {
      const entries = await readdir(path, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = join(path, entry.name);
          const stats = await stat(fullPath);
          
          return {
            path: fullPath,
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: entry.isFile() ? stats.size : null,
            modifiedAt: stats.mtime,
          };
        })
      );

      return files;
    } catch (error) {
      fastify.log.error(error, 'Failed to read directory');
      reply.code(500).send({ error: 'Failed to read directory' });
    }
  });

  // Read file content (requires authentication)
  fastify.post('/read', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { path } = request.body as { path: string };

    if (!path) {
      reply.code(400).send({ error: 'Path parameter required' });
      return;
    }

    // Validate path is in allowed directories
    if (!isPathAllowed(path)) {
      fastify.log.warn({ path, user: request.user.username }, 'Attempted unauthorized file read');
      reply.code(403).send({ error: 'Access to this file is not allowed' });
      return;
    }

    try {
      const content = await readFile(path, 'utf-8');
      return { content };
    } catch (error) {
      fastify.log.error(error, 'Failed to read file');
      reply.code(500).send({ error: 'Failed to read file' });
    }
  });

  // Download file (requires authentication)
  fastify.get('/download', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { path } = request.query as { path: string };

    if (!path) {
      reply.code(400).send({ error: 'Path parameter required' });
      return;
    }

    // Validate path is in allowed directories
    if (!isPathAllowed(path)) {
      fastify.log.warn({ path, user: request.user.username }, 'Attempted unauthorized file download');
      reply.code(403).send({ error: 'Access to this file is not allowed' });
      return;
    }

    try {
      const fileStats = await stat(path);
      
      if (!fileStats.isFile()) {
        reply.code(400).send({ error: 'Path is not a file' });
        return;
      }

      const fileName = path.split('/').pop() || 'download';
      const ext = fileName.split('.').pop()?.toLowerCase() || '';
      
      // Set content type based on extension
      const contentTypes: Record<string, string> = {
        'md': 'text/markdown',
        'txt': 'text/plain',
        'pdf': 'application/pdf',
        'csv': 'text/csv',
        'json': 'application/json',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'webp': 'image/webp',
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';

      const content = await readFile(path);
      
      reply
        .header('Content-Type', contentType)
        .header('Content-Disposition', `attachment; filename="${fileName}"`)
        .header('Content-Length', fileStats.size)
        .send(content);
    } catch (error) {
      fastify.log.error(error, 'Failed to download file');
      reply.code(500).send({ error: 'Failed to download file' });
    }
  });

  // Index project files (admin only)
  fastify.post('/index/:projectId', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    const project = await fastify.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      reply.code(404).send({ error: 'Project not found' });
      return;
    }

    // TODO: Implement recursive file indexing
    // For now, just return success
    return { success: true, message: 'File indexing not yet implemented' };
  });
};

export default fileRoutes;
