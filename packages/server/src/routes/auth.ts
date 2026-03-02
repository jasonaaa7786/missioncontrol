import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mission-control-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  password: string;
  name?: string;
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register new user (admin only in production - open for first user)
  fastify.post('/register', async (request, reply) => {
    const body = request.body as RegisterRequest;

    // Check if user already exists
    const existing = await fastify.prisma.user.findUnique({
      where: { username: body.username },
    });

    if (existing) {
      reply.code(400).send({ error: 'Username already exists' });
      return;
    }

    // Check if this is the first user (make them admin)
    const userCount = await fastify.prisma.user.count();
    const role = userCount === 0 ? 'admin' : 'viewer';

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create user
    const user = await fastify.prisma.user.create({
      data: {
        username: body.username,
        password: hashedPassword,
        name: body.name || body.username,
        role,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    reply.code(201).send({ user, token });
  });

  // Login
  fastify.post('/login', async (request, reply) => {
    const body = request.body as LoginRequest;

    // Find user
    const user = await fastify.prisma.user.findUnique({
      where: { username: body.username },
    });

    if (!user) {
      reply.code(401).send({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(body.password, user.password);

    if (!validPassword) {
      reply.code(401).send({ error: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    reply.send({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
      token,
    });
  });

  // Get current user (requires auth)
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      reply.code(404).send({ error: 'User not found' });
      return;
    }

    reply.send(user);
  });

  // List users (admin only)
  fastify.get('/users', { preHandler: [fastify.authenticate, fastify.requireAdmin] }, async (request, reply) => {
    const users = await fastify.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    reply.send(users);
  });
};

export default authRoutes;
