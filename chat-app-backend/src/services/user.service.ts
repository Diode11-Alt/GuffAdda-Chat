import { query } from '../config/db';

export class UserService {
  static async getById(userId: string) {
    const res = await query(
      'SELECT id, email, display_name, avatar_url, about, is_active, last_seen, created_at FROM users WHERE id = $1',
      [userId]
    );
    return res.rows[0] || null;
  }

  static async updateProfile(userId: string, fields: { displayName?: string; bio?: string; avatarUrl?: string }) {
    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (fields.displayName !== undefined) {
      setClauses.push(`display_name = $${idx++}`);
      values.push(fields.displayName);
    }
    if (fields.bio !== undefined) {
      setClauses.push(`about = $${idx++}`);
      values.push(fields.bio);
    }
    if (fields.avatarUrl !== undefined) {
      setClauses.push(`avatar_url = $${idx++}`);
      values.push(fields.avatarUrl);
    }

    if (setClauses.length === 0) return this.getById(userId);

    values.push(userId);
    const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING id, email, display_name, avatar_url, about, is_active, last_seen, created_at`;
    const res = await query(sql, values);
    return res.rows[0];
  }

  static async searchUsers(searchQuery: string, currentUserId: string, limit = 20) {
    const res = await query(
      `SELECT id, email, display_name, avatar_url, about, last_seen
       FROM users
       WHERE id != $1
         AND is_active = true
         AND (display_name ILIKE $2 OR email ILIKE $2)
       ORDER BY display_name ASC
       LIMIT $3`,
      [currentUserId, `%${searchQuery}%`, limit]
    );
    return res.rows;
  }

  static async updateLastSeen(userId: string) {
    await query('UPDATE users SET last_seen = NOW() WHERE id = $1', [userId]);
  }

  static async getPresence(userId: string) {
    const res = await query('SELECT last_seen, is_active FROM users WHERE id = $1', [userId]);
    return res.rows[0] || null;
  }
}
