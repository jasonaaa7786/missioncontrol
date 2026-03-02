import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mission-control-secret-change-in-production';

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JWTPayload;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    request.user = payload;
  } catch (error) {
    reply.code(401).send({ error: 'Invalid or expired token' });
  }
}

export async function requireAdminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || request.user.role !== 'admin') {
    reply.code(403).send({ error: 'Admin access required' });
    return;
  }
}
