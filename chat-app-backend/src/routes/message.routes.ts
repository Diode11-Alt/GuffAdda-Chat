import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../middleware/auth.middleware';
import { MessageService } from '../services/message.service';
import { ConversationService } from '../services/conversation.service';
import * as Sentry from '@sentry/node';

export default async function messageRoutes(fastify: FastifyInstance) {
  // Search messages across conversations
  fastify.get('/search', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { q, limit } = request.query as { q?: string; limit?: string };
      
      if (!q) return reply.send([]);

      const results = await MessageService.search(userId, q, limit ? parseInt(limit, 10) : 20);
      return reply.send(results);
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Get message history for a conversation
  fastify.get('/:conversationId', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { conversationId } = request.params as { conversationId: string };
      const { before, limit } = request.query as { before?: string; limit?: string };

      const isMember = await ConversationService.isMember(conversationId, userId);
      if (!isMember) return reply.status(403).send({ error: 'Not a member of this conversation' });

      const result = await MessageService.getHistory(conversationId, userId, {
        before,
        limit: limit ? parseInt(limit, 10) : 50,
      });

      return reply.send(result);
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Delete a message
  fastify.delete('/:messageId', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { messageId } = request.params as { messageId: string };
      const { forEveryone } = request.query as { forEveryone?: string };

      await MessageService.deleteMessage(messageId, userId, forEveryone === 'true');
      return reply.send({ success: true });
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Edit a message
  fastify.put('/:messageId', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;
      const { messageId } = request.params as { messageId: string };
      const { content } = request.body as { content: string };

      if (!content) return reply.status(400).send({ error: 'Content is required' });

      const updated = await MessageService.editMessage(messageId, userId, content);
      if (!updated) return reply.status(403).send({ error: 'Not authorized or message not found' });
      
      return reply.send(updated);
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  // Pin/Unpin a message
  fastify.put('/:messageId/pin', { preHandler: verifyToken }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { messageId } = request.params as { messageId: string };
      const { isPinned } = request.body as { isPinned: boolean };

      // (Optional) Verify user is part of the conversation first
      const updated = await MessageService.setPinned(messageId, isPinned);
      if (!updated) return reply.status(404).send({ error: 'Message not found' });
      
      return reply.send(updated);
    } catch (error) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
