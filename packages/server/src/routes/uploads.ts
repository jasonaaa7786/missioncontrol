import { FastifyPluginAsync } from 'fastify';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { homedir } from 'os';

const UPLOADS_DIR = join(homedir(), '.mission-control', 'uploads');

const uploadsRoutes: FastifyPluginAsync = async (fastify) => {
  // Ensure uploads directory exists
  await mkdir(UPLOADS_DIR, { recursive: true });

  // Upload project image
  fastify.post('/project-image', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        reply.code(400).send({ error: 'No file uploaded' });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        reply.code(400).send({ error: 'Invalid file type. Only images allowed.' });
        return;
      }

      // Generate unique filename
      const ext = data.filename.split('.').pop() || 'jpg';
      const filename = `project-${randomBytes(16).toString('hex')}.${ext}`;
      const filepath = join(UPLOADS_DIR, filename);

      // Save file
      const buffer = await data.toBuffer();
      await writeFile(filepath, buffer);

      // Return URL
      const imageUrl = `/api/uploads/${filename}`;
      
      return { imageUrl };
    } catch (error) {
      fastify.log.error(error, 'Failed to upload project image');
      reply.code(500).send({ error: 'Failed to upload image' });
    }
  });

  // Upload agent image
  fastify.post('/agent-image', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        reply.code(400).send({ error: 'No file uploaded' });
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        reply.code(400).send({ error: 'Invalid file type. Only images allowed.' });
        return;
      }

      // Generate unique filename
      const ext = data.filename.split('.').pop() || 'jpg';
      const filename = `agent-${randomBytes(16).toString('hex')}.${ext}`;
      const filepath = join(UPLOADS_DIR, filename);

      // Save file
      const buffer = await data.toBuffer();
      await writeFile(filepath, buffer);

      // Return URL
      const imageUrl = `/api/uploads/${filename}`;
      
      return { imageUrl };
    } catch (error) {
      fastify.log.error(error, 'Failed to upload agent image');
      reply.code(500).send({ error: 'Failed to upload image' });
    }
  });

  // Serve uploaded images
  fastify.get('/:filename', async (request, reply) => {
    const { filename } = request.params as { filename: string };
    
    // Validate filename (no path traversal)
    if (filename.includes('..') || filename.includes('/')) {
      reply.code(400).send({ error: 'Invalid filename' });
      return;
    }

    const filepath = join(UPLOADS_DIR, filename);
    
    try {
      const buffer = await readFile(filepath);
      
      // Determine content type from extension
      const ext = filename.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };
      
      const contentType = contentTypes[ext || ''] || 'image/jpeg';
      
      reply.header('Content-Type', contentType);
      reply.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      return reply.send(buffer);
    } catch (error) {
      reply.code(404).send({ error: 'Image not found' });
    }
  });
};

export default uploadsRoutes;
