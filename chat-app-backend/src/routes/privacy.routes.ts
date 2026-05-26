import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { redis } from '../config/redis';
import * as Sentry from '@sentry/node';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Middleware to verify token
const verifyToken = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (request as any).user = { id: decoded.userId };
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
};

export default async function privacyRoutes(fastify: FastifyInstance) {
  fastify.delete('/account', {
    preHandler: verifyToken,
    schema: {
      description: 'Delete user account and all associated data (GDPR Right to be Forgotten)',
      tags: ['privacy'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request as any).user.id;

      // 1. Fetch user to get email for Redis cleanup
      const userRes = await query('SELECT email FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length > 0) {
        const email = userRes.rows[0].email;
        if (email) {
          // Delete OTP if exists
          await redis.del(`otp:${email}`);
        }
      }

      // 2. Delete messages sent by user
      await query('DELETE FROM messages WHERE sender_id = $1', [userId]);

      // 3. Nullify conversations created by the user to avoid foreign key constraints
      await query('UPDATE conversations SET created_by = NULL WHERE created_by = $1', [userId]);

      // 4. Delete the user profile (ON DELETE CASCADE handles members, prekeys, status)
      await query('DELETE FROM users WHERE id = $1', [userId]);

      return reply.send({ success: true, message: 'Account and associated data deleted successfully' });
    } catch (error: unknown) {
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}
