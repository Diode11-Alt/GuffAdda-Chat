import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { redis } from '../config/redis';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('../config/redis', () => ({
  redis: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  }
}));

vi.mock('../config/db', () => ({
  query: vi.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTokens', () => {
    it('should return access and refresh tokens', () => {
      const tokens = AuthService.generateTokens('user-123');
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      
      const decodedAccess = jwt.decode(tokens.accessToken) as any;
      expect(decodedAccess.userId).toBe('user-123');
    });
  });

  describe('requestOtp', () => {
    it('should generate an OTP and store it in Redis', async () => {
      const email = 'test@example.com';
      const otp = await AuthService.requestOtp(email);
      
      expect(otp).toHaveLength(6);
      expect(redis.set).toHaveBeenCalledWith(`otp:${email}`, otp, 'EX', 300);
    });
  });

  describe('verifyOtp', () => {
    it('should return true and delete OTP if valid', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      
      vi.mocked(redis.get).mockResolvedValueOnce(otp);
      
      const result = await AuthService.verifyOtp(email, otp);
      
      expect(result).toBe(true);
      expect(redis.get).toHaveBeenCalledWith(`otp:${email}`);
      expect(redis.del).toHaveBeenCalledWith(`otp:${email}`);
    });

    it('should return false if OTP does not match', async () => {
      const email = 'test@example.com';
      const validOtp = '123456';
      const invalidOtp = '654321';
      
      vi.mocked(redis.get).mockResolvedValueOnce(validOtp);
      
      const result = await AuthService.verifyOtp(email, invalidOtp);
      
      expect(result).toBe(false);
      expect(redis.get).toHaveBeenCalledWith(`otp:${email}`);
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should return false if OTP does not exist', async () => {
      const email = 'test@example.com';
      const otp = '123456';
      
      vi.mocked(redis.get).mockResolvedValueOnce(null);
      
      const result = await AuthService.verifyOtp(email, otp);
      
      expect(result).toBe(false);
      expect(redis.get).toHaveBeenCalledWith(`otp:${email}`);
      expect(redis.del).not.toHaveBeenCalled();
    });
  });
});
