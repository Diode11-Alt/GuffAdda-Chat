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
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
Sentry.init({
    dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
    integrations: [
        (0, profiling_node_1.nodeProfilingIntegration)(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
});
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
const fastify_socket_io_1 = __importDefault(require("fastify-socket.io"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const cors_1 = __importDefault(require("@fastify/cors"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const media_routes_1 = __importDefault(require("./routes/media.routes"));
const privacy_routes_1 = __importDefault(require("./routes/privacy.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const chatHandlers_1 = require("./socket/chatHandlers");
const redis_1 = require("./config/redis");
dotenv_1.default.config();
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const fastify = (0, fastify_1.default)({
    logger: true
});
fastify.register(helmet_1.default, {
    crossOriginResourcePolicy: { policy: "cross-origin" }
});
fastify.register(cors_1.default, {
    origin: true, // Allow all origins for dev environment
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});
fastify.register(multipart_1.default, {
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});
fastify.register(static_1.default, {
    root: path_1.default.join(__dirname, '../uploads'),
    prefix: '/uploads/',
});
// Register Swagger
fastify.register(swagger_1.default, {
    openapi: {
        info: {
            title: 'Kura Kani API',
            description: 'REST endpoints for the Kura Kani backend',
            version: '1.0.0'
        },
        servers: [{
                url: 'http://localhost:3000'
            }]
    }
});
fastify.register(swagger_ui_1.default, {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'full',
        deepLinking: false
    },
    uiHooks: {
        onRequest: function (_request, _reply, next) { next(); },
        preHandler: function (_request, _reply, next) { next(); }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, _request, _reply) => { return swaggerObject; },
    transformSpecificationClone: true
});
// Register fastify-socket.io
fastify.register(fastify_socket_io_1.default, {
    cors: {
        origin: true,
        credentials: true
    }
});
// Register fastify-rate-limit
fastify.register(rate_limit_1.default, {
    redis: redis_1.redis,
});
// Register routes
fastify.register(auth_routes_1.default, { prefix: '/api/auth' });
fastify.register(user_routes_1.default, { prefix: '/api/users' });
fastify.register(conversation_routes_1.default, { prefix: '/api/conversations' });
fastify.register(message_routes_1.default, { prefix: '/api/messages' });
fastify.register(media_routes_1.default, { prefix: '/api/media' });
fastify.register(privacy_routes_1.default, { prefix: '/api/privacy' });
// Health check
fastify.get('/health', async (_request, _reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});
fastify.ready((err) => {
    if (err)
        throw err;
    if (fastify.io) {
        (0, chatHandlers_1.setupChatHandlers)(fastify.io);
    }
});
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3000', 10);
        await fastify.listen({ port, host: '0.0.0.0' });
        fastify.log.info(`Server listening on port ${port}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
