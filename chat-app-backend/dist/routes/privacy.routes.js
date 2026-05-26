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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = privacyRoutes;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const redis_1 = require("../config/redis");
const Sentry = __importStar(require("@sentry/node"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
// Middleware to verify token
const verifyToken = async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        request.user = { id: decoded.userId };
    }
    catch (error) {
        return reply.status(401).send({ error: 'Invalid or expired token' });
    }
};
async function privacyRoutes(fastify) {
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
    }, async (request, reply) => {
        try {
            const userId = request.user.id;
            // 1. Fetch user to get email for Redis cleanup
            const userRes = await (0, db_1.query)('SELECT email FROM users WHERE id = $1', [userId]);
            if (userRes.rows.length > 0) {
                const email = userRes.rows[0].email;
                if (email) {
                    // Delete OTP if exists
                    await redis_1.redis.del(`otp:${email}`);
                }
            }
            // 2. Delete messages sent by user
            await (0, db_1.query)('DELETE FROM messages WHERE sender_id = $1', [userId]);
            // 3. Nullify conversations created by the user to avoid foreign key constraints
            await (0, db_1.query)('UPDATE conversations SET created_by = NULL WHERE created_by = $1', [userId]);
            // 4. Delete the user profile (ON DELETE CASCADE handles members, prekeys, status)
            await (0, db_1.query)('DELETE FROM users WHERE id = $1', [userId]);
            return reply.send({ success: true, message: 'Account and associated data deleted successfully' });
        }
        catch (error) {
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
