import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://dev:dev@localhost:5432/chatdb',
});

// Simple query helper
export const query = (text: string, params?: any[]) => pool.query(text, params);
