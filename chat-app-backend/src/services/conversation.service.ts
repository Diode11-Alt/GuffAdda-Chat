import { query } from '../config/db';

export class ConversationService {
  /**
   * List all conversations for a user, with last message preview and unread count.
   */
  static async listForUser(userId: string) {
    const sql = `
      SELECT
        c.id,
        c.type,
        c.name,
        c.avatar_url,
        c.created_at,
        c.updated_at,
        cm.unread_count,
        -- Last message info
        m.id AS last_message_id,
        m.message_type AS last_message_type,
        m.encrypted_payload AS last_message_content,
        m.created_at AS last_message_at,
        m.sender_id AS last_message_sender_id,
        sender.display_name AS last_message_sender_name,
        -- For direct chats, get the other user's info
        other_user.id AS other_user_id,
        other_user.display_name AS other_user_name,
        other_user.avatar_url AS other_user_avatar,
        other_user.last_seen AS other_user_last_seen,
        other_user.is_active AS other_user_active
      FROM conversation_members cm
      JOIN conversations c ON c.id = cm.conversation_id
      LEFT JOIN messages m ON m.id = c.last_message_id
      LEFT JOIN users sender ON sender.id = m.sender_id
      -- Self-join to get the "other" user in direct chats
      LEFT JOIN conversation_members cm2
        ON cm2.conversation_id = c.id AND cm2.user_id != $1
      LEFT JOIN users other_user ON other_user.id = cm2.user_id
      WHERE cm.user_id = $1
      ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
    `;
    const res = await query(sql, [userId]);
    return res.rows;
  }

  /**
   * Find an existing direct conversation between two users.
   */
  static async findDirectConversation(userId1: string, userId2: string) {
    const sql = `
      SELECT c.id FROM conversations c
      JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = $1
      JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = $2
      WHERE c.type = 'direct'
      LIMIT 1
    `;
    const res = await query(sql, [userId1, userId2]);
    return res.rows[0]?.id || null;
  }

  /**
   * Create a new conversation (direct or group).
   */
  static async create(createdBy: string, type: 'direct' | 'group', memberIds: string[], name?: string) {
    // For direct chats, check if one already exists
    if (type === 'direct' && memberIds.length === 1) {
      const existing = await this.findDirectConversation(createdBy, memberIds[0]);
      if (existing) {
        return this.getById(existing, createdBy);
      }
    }

    const convRes = await query(
      `INSERT INTO conversations (type, name, created_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [type, name || null, createdBy]
    );
    const conversation = convRes.rows[0];

    // Add creator as admin
    await query(
      `INSERT INTO conversation_members (conversation_id, user_id, role, unread_count)
       VALUES ($1, $2, 'admin', 0)`,
      [conversation.id, createdBy]
    );

    // Add other members
    for (const memberId of memberIds) {
      if (memberId !== createdBy) {
        await query(
          `INSERT INTO conversation_members (conversation_id, user_id, role, unread_count)
           VALUES ($1, $2, 'member', 0)
           ON CONFLICT DO NOTHING`,
          [conversation.id, memberId]
        );
      }
    }

    return this.getById(conversation.id, createdBy);
  }

  /**
   * Get a single conversation with member info.
   */
  static async getById(conversationId: string, requestingUserId: string) {
    const convRes = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    if (convRes.rows.length === 0) return null;

    const membersRes = await query(
      `SELECT cm.role, cm.unread_count, cm.joined_at,
              u.id, u.display_name, u.email, u.avatar_url, u.last_seen, u.is_active
       FROM conversation_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.conversation_id = $1`,
      [conversationId]
    );

    const conversation = convRes.rows[0];
    const members = membersRes.rows;

    // For direct chats, attach the "other user" info
    if (conversation.type === 'direct') {
      const otherUser = members.find((m: any) => m.id !== requestingUserId);
      if (otherUser) {
        conversation.other_user_id = otherUser.id;
        conversation.other_user_name = otherUser.display_name;
        conversation.other_user_avatar = otherUser.avatar_url;
        conversation.other_user_last_seen = otherUser.last_seen;
        conversation.other_user_active = otherUser.is_active;
      }
    }

    return { ...conversation, members };
  }

  /**
   * Check if a user is a member of a conversation.
   */
  static async isMember(conversationId: string, userId: string): Promise<boolean> {
    const res = await query(
      'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [conversationId, userId]
    );
    return res.rows.length > 0;
  }

  /**
   * Update the last_message tracking fields.
   */
  static async updateLastMessage(conversationId: string, messageId: string) {
    await query(
      `UPDATE conversations SET last_message_id = $1, last_message_at = NOW(), updated_at = NOW() WHERE id = $2`,
      [messageId, conversationId]
    );
  }

  /**
   * Increment unread count for all members except the sender.
   */
  static async incrementUnread(conversationId: string, excludeUserId: string) {
    await query(
      `UPDATE conversation_members SET unread_count = unread_count + 1
       WHERE conversation_id = $1 AND user_id != $2`,
      [conversationId, excludeUserId]
    );
  }

  /**
   * Reset unread count for a user in a conversation.
   */
  static async markAsRead(conversationId: string, userId: string) {
    await query(
      `UPDATE conversation_members SET unread_count = 0 WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
  }

  /**
   * Update group info.
   */
  static async updateGroupInfo(conversationId: string, name?: string, avatarUrl?: string) {
    let sql = 'UPDATE conversations SET updated_at = NOW()';
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      sql += `, name = $${paramIndex++}`;
      params.push(name);
    }
    if (avatarUrl !== undefined) {
      sql += `, avatar_url = $${paramIndex++}`;
      params.push(avatarUrl);
    }

    sql += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(conversationId);

    const res = await query(sql, params);
    return res.rows[0];
  }

  /**
   * Add members to a group.
   */
  static async addMembers(conversationId: string, userIds: string[]) {
    for (const userId of userIds) {
      await query(
        `INSERT INTO conversation_members (conversation_id, user_id, role, unread_count)
         VALUES ($1, $2, 'member', 0)
         ON CONFLICT DO NOTHING`,
        [conversationId, userId]
      );
    }
  }

  /**
   * Remove a member from a group.
   */
  static async removeMember(conversationId: string, userId: string) {
    await query(
      `DELETE FROM conversation_members WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );
  }
}
