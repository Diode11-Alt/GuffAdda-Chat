import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

import Fastify from 'fastify';
import dotenv from 'dotenv';
import fastifySocketIo from 'fastify-socket.io';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import authRoutes from './routes/auth.routes';
import mediaRoutes from './routes/media.routes';
import privacyRoutes from './routes/privacy.routes';
import userRoutes from './routes/user.routes';
import conversationRoutes from './routes/conversation.routes';
import messageRoutes from './routes/message.routes';
import { setupChatHandlers } from './socket/chatHandlers';
import { Server } from 'socket.io';
import { redis } from './config/redis';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

dotenv.config();

import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

const fastify = Fastify({
  logger: true
});

fastify.register(fastifyHelmet, {
  crossOriginResourcePolicy: { policy: "cross-origin" }
});
fastify.register(fastifyCors, {
  origin: true, // Allow all origins for dev environment
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
});

fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/',
});

// Register Swagger
fastify.register(fastifySwagger, {
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

import { FastifyRequest, FastifyReply } from 'fastify';

fastify.register(fastifySwaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  uiHooks: {
    onRequest: function (_request: FastifyRequest, _reply: FastifyReply, next: () => void) { next() },
    preHandler: function (_request: FastifyRequest, _reply: FastifyReply, next: () => void) { next() }
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
  transformSpecification: (swaggerObject: Record<string, unknown>, _request: FastifyRequest, _reply: FastifyReply) => { return swaggerObject },
  transformSpecificationClone: true
});

// Register fastify-socket.io
fastify.register(fastifySocketIo, {
  cors: {
    origin: true,
    credentials: true
  }
});

// Register fastify-rate-limit
fastify.register(fastifyRateLimit, {
  redis: redis,
});
// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(userRoutes, { prefix: '/api/users' });
fastify.register(conversationRoutes, { prefix: '/api/conversations' });
fastify.register(messageRoutes, { prefix: '/api/messages' });
fastify.register(mediaRoutes, { prefix: '/api/media' });
fastify.register(privacyRoutes, { prefix: '/api/privacy' });

// Health check
fastify.get('/health', async (_request, _reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

fastify.ready((err: Error | null) => {
  if (err) throw err;
  
  if (fastify.io) {
    setupChatHandlers(fastify.io);
  }
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
