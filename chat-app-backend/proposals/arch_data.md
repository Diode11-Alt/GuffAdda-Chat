# Proposal: PostgreSQL Data Model Optimization for Millions of Messages

## Current State Analysis

The current message schema consists of three main tables:
1. `messages`: Stores the core message payload (encrypted), sender, conversation, and timestamps.
2. `message_status`: Tracks delivery/read status per message and per user.
3. `message_reactions`: Tracks user reactions to specific messages.

While this structure is fully normalized and functional for small to medium scale, it will face significant performance and storage bottlenecks when scaling to millions (or billions) of messages.

## Optimization Strategies

### 1. Partitioning the `messages` Table
**Issue**: A single `messages` table will become enormous, leading to slow index scans, bloated B-trees, and slow vacuuming.
**Solution**: Use PostgreSQL native **Time-Based Partitioning** (Range Partitioning) on the `created_at` column. 
- Partition by month or week.
- This allows rapid archiving of old messages, keeps active indexes small (fitting in RAM), and makes sequential scans on recent data very fast.

### 2. Switch to UUIDv7 for Primary Keys
**Issue**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` generates UUIDv4 (fully random). Random UUIDs cause severe index fragmentation and write amplification at scale because inserts happen all over the B-Tree.
**Solution**: Migrate to **UUIDv7**, which is time-sorted.
- This turns random inserts into append-only operations on the primary key index.
- It inherently clusters the data by time, improving cache hit rates for recent messages.

### 3. Redesign `message_status` (Crucial for Group Chats)
**Issue**: Storing a status row per message per user (`message_id`, `user_id`, `status`) results in an explosion of data. In a 50-person group chat, a single message creates 50 rows in `message_status`.
**Solution**: Implement a "Watermark" approach.
- Drop the `message_status` table for general read/delivery receipts.
- Instead, add `last_read_message_id` and `last_delivered_message_id` to the `conversation_members` table (or a dedicated `user_conversation_watermarks` table).
- Clients report "I have read up to message X", updating a single row per user per conversation. This reduces millions of rows to a small, fixed number per participant.

### 4. Index Optimization
**Issue**: Redundant and missing partial indexes.
**Solution**:
- **Drop Redundant Index**: We currently have `idx_messages_conversation_id (conversation_id)` and `idx_messages_conversation (conversation_id, created_at DESC)`. The first one is entirely redundant and should be dropped to save space and write overhead.
- **Add Partial Indexes for Background Jobs**:
  - `CREATE INDEX idx_messages_disappears ON messages(disappears_at) WHERE disappears_at IS NOT NULL;` 
  - This allows a background cleanup worker to instantly find messages that need to be deleted without scanning the whole table.

### 5. Storage Efficiency for Cryptographic Data
**Issue**: `encrypted_payload` and `iv` are stored as `TEXT`. If they are base64/hex encoded, they consume significantly more space than necessary.
**Solution**:
- Store binary data using the `BYTEA` type. 
- Base64 encoding inflates data by 33%, and hex by 100%. Decoding to binary before storing can save terabytes of storage at scale and reduce I/O overhead.

### 6. Relax Foreign Key Constraints (Optional, Extreme Scale)
**Issue**: Foreign keys (`REFERENCES conversations`, `REFERENCES users`) require PostgreSQL to check the referenced table on every insert. At extremely high throughput, these locks can cause contention.
**Solution**: If write throughput becomes a critical bottleneck, consider dropping these foreign keys and enforcing referential integrity purely at the application layer.

## Summary of Action Items
1. Migrate `id` generation from UUIDv4 to UUIDv7.
2. Drop the redundant `idx_messages_conversation_id` index.
3. Replace the per-message `message_status` table with a per-conversation user watermark.
4. Alter `encrypted_payload` and `iv` to `BYTEA` (if currently base64/hex).
5. Implement range partitioning on the `messages` table based on `created_at`.
6. Add partial indexes for cleanup tasks (`disappears_at`).
