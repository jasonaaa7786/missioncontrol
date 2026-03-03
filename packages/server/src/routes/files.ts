import { FastifyPluginAsync } from 'fastify';
import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const fileRoutes: FastifyPluginAsync = async (fastify) => {
  // List files in project directory
  fastify.get('/browse', async (request, reply) => {
    const { path } = request.query as { path: string };

    if (!path) {
      reply.code(400).send({ error: 'Path parameter required' });
      return;
    }

    // Basic path validation (prevent directory traversal)
    if (path.includes('..') || !path.startsWith('/')) {
      reply.code(400).send({ error: 'Invalid path' });
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

  // Read file content
  fastify.post('/read', async (request, reply) => {
    const { path } = request.body as { path: string };

    if (!path) {
      reply.code(400).send({ error: 'Path parameter required' });
      return;
    }

    // Basic path validation
    if (path.includes('..') || !path.startsWith('/')) {
      reply.code(400).send({ error: 'Invalid path' });
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

  // Download file
  fastify.get('/download', async (request, reply) => {
    const { path } = request.query as { path: string };

    if (!path) {
      reply.code(400).send({ error: 'Path parameter required' });
      return;
    }

    // Basic path validation
    if (path.includes('..') || !path.startsWith('/')) {
      reply.code(400).send({ error: 'Invalid path' });
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

  // Index project files
  fastify.post('/index/:projectId', async (request, reply) => {
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
