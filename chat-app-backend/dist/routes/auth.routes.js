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
exports.default = authRoutes;
const zod_1 = require("zod");
const Sentry = __importStar(require("@sentry/node"));
const auth_service_1 = require("../services/auth.service");
const bcrypt_1 = __importDefault(require("bcrypt"));
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    displayName: zod_1.z.string().min(1)
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
async function authRoutes(fastify) {
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
            const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
            const { user, tokens } = await auth_service_1.AuthService.register(email, passwordHash, displayName);
            return reply.send({ success: true, user, tokens });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
            const { user, tokens } = await auth_service_1.AuthService.login(email, password);
            return reply.send({ success: true, user, tokens });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed' });
            }
            if (error.message === 'Invalid email or password' || error.message.includes('password set')) {
                return reply.status(401).send({ error: error.message });
            }
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    const requestOtpSchema = zod_1.z.object({
        email: zod_1.z.string().email()
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
            await auth_service_1.AuthService.requestOtp(email);
            return reply.send({ success: true, message: 'OTP sent successfully (check your console in development)' });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed' });
            }
            Sentry.captureException(error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
    const verifyOtpSchema = zod_1.z.object({
        email: zod_1.z.string().email(),
        otp: zod_1.z.string().length(6)
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
            const isValid = await auth_service_1.AuthService.verifyOtp(email, otp);
            if (!isValid) {
                return reply.status(400).send({ error: 'Invalid or expired OTP' });
            }
            // If we wanted to issue JWT, we would do it here. 
            // But we just verify it for now, as requested.
            return reply.send({ success: true, message: 'OTP verified' });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed' });
            }
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
