const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://dev:dev@localhost:5432/chatdb',
});

async function runBenchmark() {
  console.log('Starting complex DB benchmark...');
  const client = await pool.connect();
  try {
    const startTime = Date.now();
    // Simulate a complex query: get unread messages for a user across all their conversations
    // Join messages, conversation_members, users and conversations
    
    // Using a random user id from the db
    const userRes = await client.query('SELECT id FROM users LIMIT 1');
    if(userRes.rowCount === 0) {
      console.log('No users found in db.');
      return;
    }
    const userId = userRes.rows[0].id;
    
    const query = `
      EXPLAIN ANALYZE
      SELECT 
        c.id as conversation_id,
        c.name as conversation_name,
        c.type as conversation_type,
        m.id as message_id,
        m.message_type,
        m.created_at,
        u.display_name as sender_name
      FROM conversation_members cm
      JOIN conversations c ON cm.conversation_id = c.id
      JOIN messages m ON c.id = m.conversation_id
      JOIN users u ON m.sender_id = u.id
      WHERE cm.user_id = $1
      AND (cm.last_read_message_id IS NULL OR m.created_at > (
        SELECT created_at FROM messages WHERE id = cm.last_read_message_id
      ))
      ORDER BY c.updated_at DESC, m.created_at DESC
      LIMIT 100;
    `;
    
    console.log('Running query for user:', userId);
    console.log(query);
    
    const res = await client.query(query, [userId]);
    
    const endTime = Date.now();
    console.log(`\nBenchmark completed in ${endTime - startTime}ms`);
    console.log('\nQuery Plan:');
    res.rows.forEach(row => {
      console.log(row['QUERY PLAN']);
    });
    
  } catch (err) {
    console.error('Error during benchmark:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runBenchmark();
