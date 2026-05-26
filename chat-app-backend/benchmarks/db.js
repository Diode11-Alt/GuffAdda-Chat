const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'dev',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'chatdb',
  password: process.env.POSTGRES_PASSWORD || 'dev',
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
});

const originalQuery = `
  SELECT
    c.id,
    c.type,
    c.name,
    c.avatar_url,
    c.created_at,
    c.updated_at,
    cm.unread_count,
    m.id AS last_message_id,
    m.message_type AS last_message_type,
    m.encrypted_payload AS last_message_content,
    m.created_at AS last_message_at,
    m.sender_id AS last_message_sender_id,
    sender.display_name AS last_message_sender_name,
    other_user.id AS other_user_id,
    other_user.display_name AS other_user_name,
    other_user.avatar_url AS other_user_avatar,
    other_user.last_seen AS other_user_last_seen,
    other_user.is_active AS other_user_active
  FROM conversation_members cm
  JOIN conversations c ON c.id = cm.conversation_id
  LEFT JOIN messages m ON m.id = c.last_message_id
  LEFT JOIN users sender ON sender.id = m.sender_id
  LEFT JOIN conversation_members cm2
    ON cm2.conversation_id = c.id AND cm2.user_id != $1
  LEFT JOIN users other_user ON other_user.id = cm2.user_id
  WHERE cm.user_id = $1
  ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
`;

const optimizedQuery = `
  SELECT
    c.id,
    c.type,
    c.name,
    c.avatar_url,
    c.created_at,
    c.updated_at,
    cm.unread_count,
    m.id AS last_message_id,
    m.message_type AS last_message_type,
    m.encrypted_payload AS last_message_content,
    m.created_at AS last_message_at,
    m.sender_id AS last_message_sender_id,
    sender.display_name AS last_message_sender_name,
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
  LEFT JOIN conversation_members cm2
    ON cm2.conversation_id = c.id 
    AND cm2.user_id != $1 
    AND c.type = 'direct'
  LEFT JOIN users other_user 
    ON other_user.id = cm2.user_id
  WHERE cm.user_id = $1
  ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
`;

async function runBenchmark() {
  console.log('Connecting to database...');
  
  // Find a user ID to test with
  let userId;
  try {
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found in the database. Creating a mock user for the test.');
      const insertRes = await pool.query(
        "INSERT INTO users (email, password_hash, display_name) VALUES ('test_bench@example.com', 'hash', 'Bench User') RETURNING id"
      );
      userId = insertRes.rows[0].id;
    } else {
      userId = userRes.rows[0].id;
    }
  } catch (err) {
    console.error('Error fetching user:', err.message);
    process.exit(1);
  }

  const iterations = 1000;
  console.log(`Running benchmark with ${iterations} iterations for user ${userId}...`);

  try {
    // Warm up the database and connection pool
    await pool.query(originalQuery, [userId]);
    await pool.query(optimizedQuery, [userId]);

    // Benchmark Original Query
    const startOriginal = performance.now();
    for (let i = 0; i < iterations; i++) {
      await pool.query(originalQuery, [userId]);
    }
    const endOriginal = performance.now();

    // Benchmark Optimized Query
    const startOptimized = performance.now();
    for (let i = 0; i < iterations; i++) {
      await pool.query(optimizedQuery, [userId]);
    }
    const endOptimized = performance.now();

    const originalTime = (endOriginal - startOriginal).toFixed(2);
    const optimizedTime = (endOptimized - startOptimized).toFixed(2);
    
    console.log('\\n--- Benchmark Results ---');
    console.log(`Original Approach : ${originalTime} ms`);
    console.log(`Optimized Approach: ${optimizedTime} ms`);
    
    const diff = parseFloat(originalTime) - parseFloat(optimizedTime);
    if (diff > 0) {
      console.log(`\\nThe optimized query is faster by ${diff.toFixed(2)} ms (${((diff / originalTime) * 100).toFixed(2)}% improvement)`);
    } else {
      console.log(`\\nThe optimized query is slower by ${Math.abs(diff).toFixed(2)} ms`);
    }

  } catch (error) {
    console.error('Benchmark failed:', error);
  } finally {
    pool.end();
  }
}

runBenchmark();
