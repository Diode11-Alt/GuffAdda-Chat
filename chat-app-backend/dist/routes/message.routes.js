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
exports.default = messageRoutes;
const auth_middleware_1 = require("../middleware/auth.middleware");
const message_service_1 = require("../services/message.service");
const conversation_service_1 = require("../services/conversation.service");
const Sentry = __importStar(require("@sentry/node"));
async function messageRoutes(fastify) {
    // Search messages across conversations
    fastify.get('/search', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { q, limit } = request.query;
            if (!q)
                return reply.send([]);
            const results = await message_service_1.MessageService.search(userId, q, limit ? parseInt(limit, 10) : 20);
            return reply.send(results);
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Get message history for a conversation
    fastify.get('/:conversationId', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { conversationId } = request.params;
            const { before, limit } = request.query;
            const isMember = await conversation_service_1.ConversationService.isMember(conversationId, userId);
            if (!isMember)
                return reply.status(403).send({ error: 'Not a member of this conversation' });
            const result = await message_service_1.MessageService.getHistory(conversationId, userId, {
                before,
                limit: limit ? parseInt(limit, 10) : 50,
            });
            return reply.send(result);
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Delete a message
    fastify.delete('/:messageId', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { messageId } = request.params;
            const { forEveryone } = request.query;
            await message_service_1.MessageService.deleteMessage(messageId, userId, forEveryone === 'true');
            return reply.send({ success: true });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Edit a message
    fastify.put('/:messageId', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const userId = request.user.id;
            const { messageId } = request.params;
            const { content } = request.body;
            if (!content)
                return reply.status(400).send({ error: 'Content is required' });
            const updated = await message_service_1.MessageService.editMessage(messageId, userId, content);
            if (!updated)
                return reply.status(403).send({ error: 'Not authorized or message not found' });
            return reply.send(updated);
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    // Pin/Unpin a message
    fastify.put('/:messageId/pin', { preHandler: auth_middleware_1.verifyToken }, async (request, reply) => {
        try {
            const { messageId } = request.params;
            const { isPinned } = request.body;
            // (Optional) Verify user is part of the conversation first
            const updated = await message_service_1.MessageService.setPinned(messageId, isPinned);
            if (!updated)
                return reply.status(404).send({ error: 'Message not found' });
            return reply.send(updated);
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
