"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const db_1 = require("../config/db");
class UserService {
    static async getById(userId) {
        const res = await (0, db_1.query)('SELECT id, email, display_name, avatar_url, about, is_active, last_seen, created_at FROM users WHERE id = $1', [userId]);
        return res.rows[0] || null;
    }
    static async updateProfile(userId, fields) {
        const setClauses = [];
        const values = [];
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
        if (setClauses.length === 0)
            return this.getById(userId);
        values.push(userId);
        const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING id, email, display_name, avatar_url, about, is_active, last_seen, created_at`;
        const res = await (0, db_1.query)(sql, values);
        return res.rows[0];
    }
    static async searchUsers(searchQuery, currentUserId, limit = 20) {
        const res = await (0, db_1.query)(`SELECT id, email, display_name, avatar_url, about, last_seen
       FROM users
       WHERE id != $1
         AND is_active = true
         AND (display_name ILIKE $2 OR email ILIKE $2)
       ORDER BY display_name ASC
       LIMIT $3`, [currentUserId, `%${searchQuery}%`, limit]);
        return res.rows;
    }
    static async updateLastSeen(userId) {
        await (0, db_1.query)('UPDATE users SET last_seen = NOW() WHERE id = $1', [userId]);
    }
    static async getPresence(userId) {
        const res = await (0, db_1.query)('SELECT last_seen, is_active FROM users WHERE id = $1', [userId]);
        return res.rows[0] || null;
    }
}
exports.UserService = UserService;
