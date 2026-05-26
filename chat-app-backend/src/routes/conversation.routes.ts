import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../middleware/auth.middleware';
import { ConversationService } from '../services/conversation.service';
import * as Sentry from '@sentry/node';

export default async function conversationRoutes(fastify: FastifyInstance) {
  // List all conversations for the authenticated user
  fastify.get('/', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const conversations = await ConversationService.listForUser(userId);
      return reply.send({ conversations });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Create a new conversation
  fastify.post('/', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { type, memberIds, name } = request.body as {
        type: 'direct' | 'group';
        memberIds: string[];
        name?: string;
      };

      if (!type || !memberIds || memberIds.length === 0) {
        return reply.status(400).send({ error: 'type and memberIds are required' });
      }

      if (type === 'direct' && memberIds.length !== 1) {
        return reply.status(400).send({ error: 'Direct conversations require exactly one other member' });
      }

      const conversation = await ConversationService.create(userId, type, memberIds, name);
      return reply.send({ conversation });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Get a specific conversation
  fastify.get('/:id', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };

      const isMember = await ConversationService.isMember(id, userId);
      if (!isMember) return reply.status(403).send({ error: 'Not a member of this conversation' });

      const conversation = await ConversationService.getById(id, userId);
      if (!conversation) return reply.status(404).send({ error: 'Conversation not found' });

      return reply.send({ conversation });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Mark conversation as read
  fastify.put('/:id/read', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      await ConversationService.markAsRead(id, userId);
      return reply.send({ success: true });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Update group info
  fastify.put('/:id', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const { name, avatar_url } = request.body as { name?: string, avatar_url?: string };

      const isMember = await ConversationService.isMember(id, userId);
      if (!isMember) return reply.status(403).send({ error: 'Not a member of this conversation' });

      const updated = await ConversationService.updateGroupInfo(id, name, avatar_url);
      return reply.send({ conversation: updated });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Add members
  fastify.post('/:id/members', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { id } = request.params as { id: string };
      const { userIds } = request.body as { userIds: string[] };

      const isMember = await ConversationService.isMember(id, userId);
      if (!isMember) return reply.status(403).send({ error: 'Not a member of this conversation' });

      await ConversationService.addMembers(id, userIds);
      return reply.send({ success: true });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Remove member
  fastify.delete('/:id/members/:memberId', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { id, memberId } = request.params as { id: string, memberId: string };

      const isMember = await ConversationService.isMember(id, userId);
      if (!isMember) return reply.status(403).send({ error: 'Not a member of this conversation' });

      await ConversationService.removeMember(id, memberId);
      return reply.send({ success: true });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
