"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const db_1 = require("../config/db");
class MessageService {
    /**
     * Persist a new message to the database.
     */
    static async create(data) {
        const res = await (0, db_1.query)(`INSERT INTO messages (conversation_id, sender_id, message_type, encrypted_payload, iv, reply_to_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [
            data.conversationId,
            data.senderId,
            data.messageType || 'text',
            data.content,
            data.iv || '',
            data.replyToId || null,
        ]);
        const message = res.rows[0];
        // Get sender info
        const senderRes = await (0, db_1.query)('SELECT id, display_name, avatar_url FROM users WHERE id = $1', [data.senderId]);
        return {
            ...message,
            sender: senderRes.rows[0] || null,
        };
    }
    /**
     * Get paginated messages for a conversation (cursor-based, newest first).
     */
    static async getHistory(conversationId, userId, options) {
        const limit = Math.min(options.limit || 50, 100);
        let sql;
        let params;
        if (options.before) {
            sql = `
        SELECT m.*, u.display_name AS sender_name, u.avatar_url AS sender_avatar,
          (
            SELECT json_agg(json_build_object('user_id', r.user_id, 'reaction', r.reaction))
            FROM message_reactions r WHERE r.message_id = m.id
          ) as reactions,
          (
            SELECT MAX(CASE WHEN ms.status = 'read' THEN 2 WHEN ms.status = 'delivered' THEN 1 ELSE 0 END)
            FROM message_status ms WHERE ms.message_id = m.id AND ms.user_id != $3
          ) as read_level
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = $1
          AND m.created_at < (SELECT created_at FROM messages WHERE id = $2)
          AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT $4
      `;
            params = [conversationId, options.before, userId, limit];
        }
        else {
            sql = `
        SELECT m.*, u.display_name AS sender_name, u.avatar_url AS sender_avatar,
          (
            SELECT json_agg(json_build_object('user_id', r.user_id, 'reaction', r.reaction))
            FROM message_reactions r WHERE r.message_id = m.id
          ) as reactions,
          (
            SELECT MAX(CASE WHEN ms.status = 'read' THEN 2 WHEN ms.status = 'delivered' THEN 1 ELSE 0 END)
            FROM message_status ms WHERE ms.message_id = m.id AND ms.user_id != $2
          ) as read_level
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = $1
          AND m.is_deleted = false
        ORDER BY m.created_at DESC
        LIMIT $3
      `;
            params = [conversationId, userId, limit];
        }
        const res = await (0, db_1.query)(sql, params);
        // Return in chronological order (oldest first) for display
        const messages = res.rows.map(row => {
            let status = 'sent';
            if (row.read_level === 2)
                status = 'read';
            else if (row.read_level === 1)
                status = 'delivered';
            return { ...row, status };
        }).reverse();
        const hasMore = res.rows.length === limit;
        return { messages, hasMore };
    }
    /**
     * Update message status (sent → delivered → read).
     */
    static async updateStatus(messageId, userId, status) {
        await (0, db_1.query)(`INSERT INTO message_status (message_id, user_id, status, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (message_id, user_id) DO UPDATE SET status = $3, updated_at = NOW()`, [messageId, userId, status]);
    }
    /**
     * Soft-delete a message.
     */
    static async deleteMessage(messageId, userId, forEveryone) {
        if (forEveryone) {
            // Only the sender can delete for everyone
            await (0, db_1.query)(`UPDATE messages SET is_deleted = true, deleted_for_everyone_at = NOW()
         WHERE id = $1 AND sender_id = $2`, [messageId, userId]);
        }
        // "Delete for me" would be handled client-side or with a separate table
    }
    /**
     * Edit a message.
     */
    static async editMessage(messageId, userId, newContent) {
        const res = await (0, db_1.query)(`UPDATE messages SET encrypted_payload = $1, is_edited = true, updated_at = NOW()
       WHERE id = $2 AND sender_id = $3 AND is_deleted = false
       RETURNING *`, [newContent, messageId, userId]);
        return res.rows[0];
    }
    /**
     * Pin or unpin a message.
     */
    static async setPinned(messageId, isPinned) {
        const res = await (0, db_1.query)(`UPDATE messages SET is_pinned = $1
       WHERE id = $2 AND is_deleted = false
       RETURNING *`, [isPinned, messageId]);
        return res.rows[0];
    }
    /**
     * Search messages for a given user across their conversations.
     */
    static async search(userId, queryText, limit = 20) {
        const res = await (0, db_1.query)(`
      SELECT m.*, u.display_name AS sender_name, u.avatar_url AS sender_avatar, c.type AS conversation_type, c.name AS conversation_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
      JOIN conversations c ON c.id = m.conversation_id
      WHERE cm.user_id = $1
        AND m.is_deleted = false
        AND m.message_type = 'text'
        AND m.encrypted_payload ILIKE $2
      ORDER BY m.created_at DESC
      LIMIT $3
      `, [userId, `%${queryText}%`, limit]);
        return res.rows;
    }
    /**
     * Add a reaction to a message.
     */
    static async addReaction(messageId, userId, reaction) {
        await (0, db_1.query)(`INSERT INTO message_reactions (message_id, user_id, reaction, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT DO NOTHING`, [messageId, userId, reaction]);
    }
    /**
     * Remove a reaction from a message.
     */
    static async removeReaction(messageId, userId, reaction) {
        await (0, db_1.query)(`DELETE FROM message_reactions
       WHERE message_id = $1 AND user_id = $2 AND reaction = $3`, [messageId, userId, reaction]);
    }
}
exports.MessageService = MessageService;
