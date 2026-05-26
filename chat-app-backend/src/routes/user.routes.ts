import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../middleware/auth.middleware';
import { UserService } from '../services/user.service';
import * as Sentry from '@sentry/node';

export default async function userRoutes(fastify: FastifyInstance) {
  // Get current user profile
  fastify.get('/me', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const user = await UserService.getById(userId);
      if (!user) return reply.status(404).send({ error: 'User not found' });
      return reply.send({ user });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Update current user profile
  fastify.put('/me', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const body = request.body as any;
      const user = await UserService.updateProfile(userId, {
        displayName: body.displayName,
        bio: body.bio,
        avatarUrl: body.avatarUrl,
      });
      return reply.send({ user });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Search users
  fastify.get('/search', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { q } = request.query as { q?: string };
      if (!q || q.trim().length < 1) {
        return reply.send({ users: [] });
      }
      const users = await UserService.searchUsers(q.trim(), userId);
      return reply.send({ users });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Get user by ID
  fastify.get('/:userId', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      const user = await UserService.getById(userId);
      if (!user) return reply.status(404).send({ error: 'User not found' });
      return reply.send({ user });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
