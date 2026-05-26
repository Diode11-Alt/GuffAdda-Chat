import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as Sentry from '@sentry/node';
import { AuthService } from '../services/auth.service';
import bcrypt from 'bcrypt';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    },
    schema: {
      description: 'Register a new user',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'displayName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          displayName: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: { type: 'object', additionalProperties: true },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' }
              }
            }
          }
        },
        400: {
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
      const { email, password, displayName } = registerSchema.parse(request.body);
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      const { user, tokens } = await AuthService.register(email, passwordHash, displayName);
      return reply.send({ success: true, user, tokens });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation failed: ' + error.issues[0].message });
      }
      if (error.message === 'Email already registered') {
        return reply.status(400).send({ error: error.message });
      }
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  fastify.post('/login', {
    schema: {
      description: 'Login an existing user',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            user: { type: 'object', additionalProperties: true },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
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
      const { email, password } = loginSchema.parse(request.body);
      const { user, tokens } = await AuthService.login(email, password);
      
      return reply.send({ success: true, user, tokens });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation failed' });
      }
      if (error.message === 'Invalid email or password' || error.message.includes('password set')) {
         return reply.status(401).send({ error: error.message });
      }
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  const requestOtpSchema = z.object({
    email: z.string().email()
  });

  fastify.post('/request-otp', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '5 minutes'
      }
    },
    schema: {
      description: 'Request OTP for email verification or passwordless login',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        429: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' }
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
      const { email } = requestOtpSchema.parse(request.body);
      await AuthService.requestOtp(email);
      return reply.send({ success: true, message: 'OTP sent successfully (check your console in development)' });
    } catch (error: any) {
       if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation failed' });
      }
      Sentry.captureException(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  const verifyOtpSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6)
  });

  fastify.post('/verify-otp', {
    schema: {
      description: 'Verify OTP',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: { type: 'string', format: 'email' },
          otp: { type: 'string', minLength: 6, maxLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        400: {
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
      const { email, otp } = verifyOtpSchema.parse(request.body);
      const isValid = await AuthService.verifyOtp(email, otp);
      if (!isValid) {
        return reply.status(400).send({ error: 'Invalid or expired OTP' });
      }
      // If we wanted to issue JWT, we would do it here. 
      // But we just verify it for now, as requested.
      return reply.send({ success: true, message: 'OTP verified' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Validation failed' });
      }
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
}

