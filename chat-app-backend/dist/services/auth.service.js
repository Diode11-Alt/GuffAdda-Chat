"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../config/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'superrefreshsecret';
class AuthService {
    static async register(email, passwordHash, displayName) {
        // Check if user exists
        const checkRes = await (0, db_1.query)('SELECT id FROM users WHERE email = $1', [email]);
        if (checkRes.rows.length > 0) {
            throw new Error('Email already registered');
        }
        // Since it's Sprint 1, we stub out keys for now
        const defaultKey = 'placeholder_key';
        const insertQuery = `
      INSERT INTO users (email, password_hash, display_name, identity_public_key, signed_prekey_public, signed_prekey_signature, registration_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, display_name
    `;
        const res = await (0, db_1.query)(insertQuery, [email, passwordHash, displayName, defaultKey, defaultKey, defaultKey, 1]);
        const user = res.rows[0];
        const tokens = this.generateTokens(user.id);
        return { user, tokens };
    }
    static async login(email, passwordHashAttempt) {
        const res = await (0, db_1.query)('SELECT id, email, display_name, password_hash FROM users WHERE email = $1', [email]);
        const user = res.rows[0];
        if (!user) {
            throw new Error('Invalid email or password');
        }
        if (!user.password_hash) {
            throw new Error('User has no password set. Please use the appropriate login method.');
        }
        const isValid = await bcrypt_1.default.compare(passwordHashAttempt, user.password_hash);
        if (!isValid) {
            throw new Error('Invalid email or password');
        }
        // Don't leak password hash to client
        const { password_hash, ...safeUser } = user;
        const tokens = this.generateTokens(user.id);
        return { user: safeUser, tokens };
    }
    static generateTokens(userId) {
        const accessToken = jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
        return { accessToken, refreshToken };
    }
    static async requestOtp(email) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const { redis } = require('../config/redis');
        await redis.set(`otp:${email}`, otp, 'EX', 300);
        return otp;
    }
    static async verifyOtp(email, otp) {
        const { redis } = require('../config/redis');
        const storedOtp = await redis.get(`otp:${email}`);
        if (storedOtp && storedOtp === otp) {
            await redis.del(`otp:${email}`);
            return true;
        }
        return false;
    }
}
exports.AuthService = AuthService;
