import { describe, it, expect, vi, beforeEach } from 'vitest';
import fastify, { FastifyInstance } from 'fastify';
import userRoutes from '../src/routes/user.routes';
import { UserService } from '../src/services/user.service';

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}));

vi.mock('../src/services/user.service', () => ({
  UserService: {
    getById: vi.fn(),
    updateProfile: vi.fn(),
    searchUsers: vi.fn(),
  }
}));

vi.mock('../src/middleware/auth.middleware', () => ({
  verifyToken: vi.fn(async (request) => {
    (request as any).user = { id: 'user1' };
  })
}));

describe('User Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = fastify();
    app.register(userRoutes);
    await app.ready();
    vi.clearAllMocks();
  });

  describe('GET /search', () => {
    it('should return empty array if query is missing or empty', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/search',
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ users: [] });
    });

    it('should return users from UserService.searchUsers', async () => {
      const mockUsers = [
        { id: 'user2', email: 'test@example.com', display_name: 'Test' }
      ];
      vi.mocked(UserService.searchUsers).mockResolvedValue(mockUsers as any);

      const response = await app.inject({
        method: 'GET',
        url: '/search?q=test',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ users: mockUsers });
      expect(UserService.searchUsers).toHaveBeenCalledWith('test', 'user1');
    });

    it('should return 500 if UserService throws', async () => {
      vi.mocked(UserService.searchUsers).mockRejectedValue(new Error('DB Error'));

      const response = await app.inject({
        method: 'GET',
        url: '/search?q=test',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ error: 'Internal Server Error' });
    });
  });

  describe('PUT /me', () => {
    it('should update user profile and return user', async () => {
      const updatedUser = { id: 'user1', display_name: 'New Name' };
      vi.mocked(UserService.updateProfile).mockResolvedValue(updatedUser as any);

      const response = await app.inject({
        method: 'PUT',
        url: '/me',
        payload: {
          displayName: 'New Name'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ user: updatedUser });
      expect(UserService.updateProfile).toHaveBeenCalledWith('user1', {
        displayName: 'New Name',
        bio: undefined,
        avatarUrl: undefined,
      });
    });

    it('should return 500 if UserService throws', async () => {
      vi.mocked(UserService.updateProfile).mockRejectedValue(new Error('DB Error'));

      const response = await app.inject({
        method: 'PUT',
        url: '/me',
        payload: {
          displayName: 'New Name'
        }
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({ error: 'Internal Server Error' });
    });
  });
});
