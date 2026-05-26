"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const auth_service_1 = require("./auth.service");
const redis_1 = require("../config/redis");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mock dependencies
vitest_1.vi.mock('../config/redis', () => ({
    redis: {
        set: vitest_1.vi.fn(),
        get: vitest_1.vi.fn(),
        del: vitest_1.vi.fn(),
    }
}));
vitest_1.vi.mock('../config/db', () => ({
    query: vitest_1.vi.fn(),
}));
(0, vitest_1.describe)('AuthService', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('generateTokens', () => {
        (0, vitest_1.it)('should return access and refresh tokens', () => {
            const tokens = auth_service_1.AuthService.generateTokens('user-123');
            (0, vitest_1.expect)(tokens).toHaveProperty('accessToken');
            (0, vitest_1.expect)(tokens).toHaveProperty('refreshToken');
            const decodedAccess = jsonwebtoken_1.default.decode(tokens.accessToken);
            (0, vitest_1.expect)(decodedAccess.userId).toBe('user-123');
        });
    });
    (0, vitest_1.describe)('requestOtp', () => {
        (0, vitest_1.it)('should generate an OTP and store it in Redis', async () => {
            const email = 'test@example.com';
            const otp = await auth_service_1.AuthService.requestOtp(email);
            (0, vitest_1.expect)(otp).toHaveLength(6);
            (0, vitest_1.expect)(redis_1.redis.set).toHaveBeenCalledWith(`otp:${email}`, otp, 'EX', 300);
        });
    });
    (0, vitest_1.describe)('verifyOtp', () => {
        (0, vitest_1.it)('should return true and delete OTP if valid', async () => {
            const email = 'test@example.com';
            const otp = '123456';
            vitest_1.vi.mocked(redis_1.redis.get).mockResolvedValueOnce(otp);
            const result = await auth_service_1.AuthService.verifyOtp(email, otp);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(redis_1.redis.get).toHaveBeenCalledWith(`otp:${email}`);
            (0, vitest_1.expect)(redis_1.redis.del).toHaveBeenCalledWith(`otp:${email}`);
        });
        (0, vitest_1.it)('should return false if OTP does not match', async () => {
            const email = 'test@example.com';
            const validOtp = '123456';
            const invalidOtp = '654321';
            vitest_1.vi.mocked(redis_1.redis.get).mockResolvedValueOnce(validOtp);
            const result = await auth_service_1.AuthService.verifyOtp(email, invalidOtp);
            (0, vitest_1.expect)(result).toBe(false);
            (0, vitest_1.expect)(redis_1.redis.get).toHaveBeenCalledWith(`otp:${email}`);
            (0, vitest_1.expect)(redis_1.redis.del).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return false if OTP does not exist', async () => {
            const email = 'test@example.com';
            const otp = '123456';
            vitest_1.vi.mocked(redis_1.redis.get).mockResolvedValueOnce(null);
            const result = await auth_service_1.AuthService.verifyOtp(email, otp);
            (0, vitest_1.expect)(result).toBe(false);
            (0, vitest_1.expect)(redis_1.redis.get).toHaveBeenCalledWith(`otp:${email}`);
            (0, vitest_1.expect)(redis_1.redis.del).not.toHaveBeenCalled();
        });
    });
});
