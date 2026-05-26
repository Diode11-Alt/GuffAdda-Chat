const { query } = require('../dist/config/db'); // Adjust path based on execution context

/**
 * Extremely optimized raw SQL query for fetching a user's conversations.
 * 
 * Optimizations applied:
 * 1. Fixed a Cartesian product bug: Added `c.type = 'direct'` to the `cm2` join 
 *    to prevent duplicate row explosion for group chats. Without this, group chats with N members 
 *    would return N-1 duplicate rows per conversation.
 * 2. Explicit `INNER JOIN` for `conversations` allows the query planner to optimally start 
 *    from `conversation_members` index on `user_id`, then fetch `conversations`.
 * 3. Leveraging `COALESCE` for ordering directly on the indexed/timestamp columns.
 */
async function fetchConversationsOptimized(userId) {
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
    INNER JOIN conversations c 
      ON c.id = cm.conversation_id
    LEFT JOIN messages m 
      ON m.id = c.last_message_id
    LEFT JOIN users sender 
      ON sender.id = m.sender_id
    -- Optimized: Only join the other user if it is a 'direct' conversation type
    LEFT JOIN conversation_members cm2
      ON cm2.conversation_id = c.id 
      AND cm2.user_id != $1 
      AND c.type = 'direct'
    LEFT JOIN users other_user 
      ON other_user.id = cm2.user_id
    WHERE cm.user_id = $1
    ORDER BY COALESCE(c.last_message_at, c.created_at) DESC;
  `;
  
  const res = await query(sql, [userId]);
  return res.rows;
}

module.exports = {
  fetchConversationsOptimized
};
