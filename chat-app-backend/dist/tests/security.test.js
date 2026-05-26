"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fastify_1 = __importDefault(require("fastify"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
(0, vitest_1.describe)('Security and Rate Limiting Tests', () => {
    const app = (0, fastify_1.default)();
    const JWT_SECRET = 'test-secret';
    // A mock variable to keep track of rate limits in our dummy endpoint
    let loginRequests = 0;
    (0, vitest_1.beforeAll)(async () => {
        // Mocking a middleware for protecting routes
        const authMiddleware = async (request, reply) => {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({ error: 'Unauthorized: No token provided' });
            }
            const token = authHeader.split(' ')[1];
            try {
                jsonwebtoken_1.default.verify(token, JWT_SECRET);
            }
            catch (_err) {
                return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
            }
        };
        // Mocking a protected route
        app.get('/api/protected', { preHandler: authMiddleware }, async (_request, _reply) => {
            return { data: 'Secure data' };
        });
        // Mocking a login route with rate limiting
        app.post('/api/auth/login', async (_request, reply) => {
            loginRequests++;
            if (loginRequests > 5) {
                return reply.status(429).send({ error: 'Too Many Requests' });
            }
            return { success: true, message: 'Logged in' };
        });
        await app.ready();
    });
    (0, vitest_1.it)('Accessing a protected route with no token returns 401', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/protected',
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
        (0, vitest_1.expect)(response.json()).toEqual({ error: 'Unauthorized: No token provided' });
    });
    (0, vitest_1.it)('Accessing a protected route with a tampered JWT token returns 401', async () => {
        // Create a valid token and then tamper with it
        const validToken = jsonwebtoken_1.default.sign({ userId: 1 }, JWT_SECRET, { expiresIn: '1h' });
        const tamperedToken = validToken.substring(0, validToken.length - 2) + 'XX';
        const response = await app.inject({
            method: 'GET',
            url: '/api/protected',
            headers: {
                authorization: `Bearer ${tamperedToken}`
            }
        });
        (0, vitest_1.expect)(response.statusCode).toBe(401);
        (0, vitest_1.expect)(response.json()).toEqual({ error: 'Unauthorized: Invalid token' });
    });
    (0, vitest_1.it)('Rate limit simulation: hitting login endpoint 6 times triggers 429', async () => {
        // Hit it 5 times (should be OK)
        for (let i = 0; i < 5; i++) {
            const res = await app.inject({
                method: 'POST',
                url: '/api/auth/login',
            });
            (0, vitest_1.expect)(res.statusCode).toBe(200);
        }
        // Hit it the 6th time (should trigger 429)
        const rateLimitedRes = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
        });
        (0, vitest_1.expect)(rateLimitedRes.statusCode).toBe(429);
        (0, vitest_1.expect)(rateLimitedRes.json()).toEqual({ error: 'Too Many Requests' });
    });
});
