import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { redis } from '../config/redis';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'superrefreshsecret';

export class AuthService {
  static async register(email: string, passwordHash: string, displayName: string): Promise<{ user: any, tokens: any }> {
    // Check if user exists
    const checkRes = await query('SELECT id FROM users WHERE email = $1', [email]);
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
    const res = await query(insertQuery, [email, passwordHash, displayName, defaultKey, defaultKey, defaultKey, 1]);
    const user = res.rows[0];

    const tokens = this.generateTokens(user.id);
    return { user, tokens };
  }

  static async login(email: string, passwordHashAttempt: string): Promise<{ user: any, tokens: any }> {
    const res = await query('SELECT id, email, display_name, password_hash FROM users WHERE email = $1', [email]);
    const user = res.rows[0];

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.password_hash) {
      throw new Error('User has no password set. Please use the appropriate login method.');
    }

    const isValid = await bcrypt.compare(passwordHashAttempt, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Don't leak password hash to client
    const { password_hash, ...safeUser } = user;

    const tokens = this.generateTokens(user.id);
    return { user: safeUser, tokens };
  }

  static generateTokens(userId: string) {
    const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
    return { accessToken, refreshToken };
  }

  static async requestOtp(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(`otp:${email}`, otp, 'EX', 300);
    return otp;
  }

  static async verifyOtp(email: string, otp: string): Promise<boolean> {
    const storedOtp = await redis.get(`otp:${email}`);
    if (storedOtp && storedOtp === otp) {
      await redis.del(`otp:${email}`);
      return true;
    }
    return false;
  }
}
