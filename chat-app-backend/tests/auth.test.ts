import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import authRoutes from '../src/routes/auth.routes';
import { AuthService } from '../src/services/auth.service';

vi.mock('../src/services/auth.service', () => {
  return {
    AuthService: {
      register: vi.fn(),
      login: vi.fn(),
      requestOtp: vi.fn(),
      verifyOtp: vi.fn(),
      generateTokens: vi.fn()
    }
  };
});

describe('auth.routes', () => {
  let fastify: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    fastify = Fastify();
    fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.ready();
  });

  describe('POST /api/auth/request-otp', () => {
    it('should generate an OTP', async () => {
      vi.mocked(AuthService.requestOtp).mockResolvedValueOnce('123456');

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/request-otp',
        payload: { email: 'test@example.com' }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        success: true,
        message: 'OTP sent successfully (check your console in development)'
      });
      expect(AuthService.requestOtp).toHaveBeenCalledWith('test@example.com');
    });

    it('should fail with invalid email', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/request-otp',
        payload: { email: 'invalid-email' }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should verify OTP successfully', async () => {
      vi.mocked(AuthService.verifyOtp).mockResolvedValueOnce(true);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/verify-otp',
        payload: { email: 'test@example.com', otp: '123456' }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        success: true,
        message: 'OTP verified'
      });
      expect(AuthService.verifyOtp).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('should fail with invalid OTP', async () => {
      vi.mocked(AuthService.verifyOtp).mockResolvedValueOnce(false);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/verify-otp',
        payload: { email: 'test@example.com', otp: '123456' }
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toContain('Invalid or expired OTP');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login and issue JWT', async () => {
      const user = { id: '1', email: 'test@example.com' };
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      
      vi.mocked(AuthService.login).mockResolvedValueOnce({ user, tokens });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'test@example.com', password: 'password123' }
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        success: true,
        user,
        tokens
      });
    });
  });
});
