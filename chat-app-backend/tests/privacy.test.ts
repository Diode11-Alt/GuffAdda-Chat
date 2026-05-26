import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import privacyRoutes from '../src/routes/privacy.routes';
import jwt from 'jsonwebtoken';
import { query } from '../src/config/db';
import { redis } from '../src/config/redis';
import * as Sentry from '@sentry/node';

vi.mock('../src/config/db', () => ({
  query: vi.fn(),
}));

vi.mock('../src/config/redis', () => ({
  redis: {
    del: vi.fn(),
  },
}));

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}));

describe('Privacy Routes (GDPR Right to be Forgotten)', () => {
  let fastify: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    vi.clearAllMocks();
    fastify = Fastify();
    await fastify.register(privacyRoutes);
  });

  afterEach(async () => {
    await fastify.close();
  });

  const validToken = jwt.sign({ userId: '123' }, 'supersecret');

  it('should return 401 if token is missing', async () => {
    const response = await fastify.inject({
      method: 'DELETE',
      url: '/account',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('should successfully delete user account and associated data', async () => {
    // Mock the query for getting the user email
    (query as any).mockResolvedValueOnce({ rows: [{ email: 'test@example.com' }] });
    // Mock the other queries (messages, conversations, users)
    (query as any).mockResolvedValue({ rowCount: 1 });

    const response = await fastify.inject({
      method: 'DELETE',
      url: '/account',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true, message: 'Account and associated data deleted successfully' });

    // Verify 1. Fetch user email
    expect(query).toHaveBeenNthCalledWith(1, 'SELECT email FROM users WHERE id = $1', ['123']);
    
    // Verify Redis OTP deletion
    expect(redis.del).toHaveBeenCalledWith('otp:test@example.com');

    // Verify 2. Delete messages
    expect(query).toHaveBeenNthCalledWith(2, 'DELETE FROM messages WHERE sender_id = $1', ['123']);

    // Verify 3. Nullify conversations
    expect(query).toHaveBeenNthCalledWith(3, 'UPDATE conversations SET created_by = NULL WHERE created_by = $1', ['123']);

    // Verify 4. Delete user profile
    expect(query).toHaveBeenNthCalledWith(4, 'DELETE FROM users WHERE id = $1', ['123']);
  });

  it('should successfully delete account even if user has no email', async () => {
    // Mock the query for getting the user email - returns empty or no email
    (query as any).mockResolvedValueOnce({ rows: [] });
    (query as any).mockResolvedValue({ rowCount: 1 });

    const response = await fastify.inject({
      method: 'DELETE',
      url: '/account',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    });

    expect(response.statusCode).toBe(200);

    // Redis del should not be called since there is no email
    expect(redis.del).not.toHaveBeenCalled();

    // Still executes other queries
    expect(query).toHaveBeenCalledTimes(4);
  });

  it('should return 500 and capture exception if a database error occurs', async () => {
    const dbError = new Error('Database connection failed');
    (query as any).mockRejectedValue(dbError);

    const response = await fastify.inject({
      method: 'DELETE',
      url: '/account',
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: 'Internal Server Error' });
    
    // Verify Sentry captured the exception
    expect(Sentry.captureException).toHaveBeenCalledWith(dbError);
  });
});
