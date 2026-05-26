"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = userRoutes;
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_service_1 = require("../services/user.service");
const Sentry = __importStar(require("@sentry/node"));
async function userRoutes(fastify) {
    // Get current user profile
    fastify.get('/me', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const user = await user_service_1.UserService.getById(userId);
            if (!user)
                return reply.status(404).send({ error: 'User not found' });
            return reply.send({ user });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Update current user profile
    fastify.put('/me', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const body = request.body;
            const user = await user_service_1.UserService.updateProfile(userId, {
                displayName: body.displayName,
                bio: body.bio,
                avatarUrl: body.avatarUrl,
            });
            return reply.send({ user });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Search users
    fastify.get('/search', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { q } = request.query;
            if (!q || q.trim().length < 1) {
                return reply.send({ users: [] });
            }
            const users = await user_service_1.UserService.searchUsers(q.trim(), userId);
            return reply.send({ users });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Get user by ID
    fastify.get('/:userId', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const { userId } = request.params;
            const user = await user_service_1.UserService.getById(userId);
            if (!user)
                return reply.status(404).send({ error: 'User not found' });
            return reply.send({ user });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
