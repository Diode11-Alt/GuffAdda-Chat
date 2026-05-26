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
exports.default = conversationRoutes;
const auth_middleware_1 = require("../middleware/auth.middleware");
const conversation_service_1 = require("../services/conversation.service");
const Sentry = __importStar(require("@sentry/node"));
async function conversationRoutes(fastify) {
    // List all conversations for the authenticated user
    fastify.get('/', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const conversations = await conversation_service_1.ConversationService.listForUser(userId);
            return reply.send({ conversations });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Create a new conversation
    fastify.post('/', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { type, memberIds, name } = request.body;
            if (!type || !memberIds || memberIds.length === 0) {
                return reply.status(400).send({ error: 'type and memberIds are required' });
            }
            if (type === 'direct' && memberIds.length !== 1) {
                return reply.status(400).send({ error: 'Direct conversations require exactly one other member' });
            }
            const conversation = await conversation_service_1.ConversationService.create(userId, type, memberIds, name);
            return reply.send({ conversation });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Get a specific conversation
    fastify.get('/:id', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { id } = request.params;
            const isMember = await conversation_service_1.ConversationService.isMember(id, userId);
            if (!isMember)
                return reply.status(403).send({ error: 'Not a member of this conversation' });
            const conversation = await conversation_service_1.ConversationService.getById(id, userId);
            if (!conversation)
                return reply.status(404).send({ error: 'Conversation not found' });
            return reply.send({ conversation });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Mark conversation as read
    fastify.put('/:id/read', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { id } = request.params;
            await conversation_service_1.ConversationService.markAsRead(id, userId);
            return reply.send({ success: true });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Update group info
    fastify.put('/:id', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { id } = request.params;
            const { name, avatar_url } = request.body;
            const isMember = await conversation_service_1.ConversationService.isMember(id, userId);
            if (!isMember)
                return reply.status(403).send({ error: 'Not a member of this conversation' });
            const updated = await conversation_service_1.ConversationService.updateGroupInfo(id, name, avatar_url);
            return reply.send({ conversation: updated });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Add members
    fastify.post('/:id/members', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { id } = request.params;
            const { userIds } = request.body;
            const isMember = await conversation_service_1.ConversationService.isMember(id, userId);
            if (!isMember)
                return reply.status(403).send({ error: 'Not a member of this conversation' });
            await conversation_service_1.ConversationService.addMembers(id, userIds);
            return reply.send({ success: true });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Remove member
    fastify.delete('/:id/members/:memberId', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { id, memberId } = request.params;
            const isMember = await conversation_service_1.ConversationService.isMember(id, userId);
            if (!isMember)
                return reply.status(403).send({ error: 'Not a member of this conversation' });
            await conversation_service_1.ConversationService.removeMember(id, memberId);
            return reply.send({ success: true });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
