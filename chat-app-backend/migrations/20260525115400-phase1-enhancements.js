'use strict';

var dbm;
var type;
var seed;

exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  const sql = `
    -- Add unread_count and last_read_message_id to conversation_members
    ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;
    ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS last_read_message_id UUID;

    -- Add last_message tracking to conversations
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_id UUID;
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

    -- Contacts table
    CREATE TABLE IF NOT EXISTS contacts (
      user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
      contact_id   UUID REFERENCES users(id) ON DELETE CASCADE,
      nickname     VARCHAR(100),
      is_blocked   BOOLEAN DEFAULT false,
      created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (user_id, contact_id)
    );

    -- Notification settings (per-conversation mute)
    CREATE TABLE IF NOT EXISTS notification_settings (
      user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
      conversation_id  UUID REFERENCES conversations(id) ON DELETE CASCADE,
      muted_until      TIMESTAMP WITH TIME ZONE,
      PRIMARY KEY (user_id, conversation_id)
    );
  `;
  db.runSql(sql, callback);
};

exports.down = function(db, callback) {
  const sql = `
    DROP TABLE IF EXISTS notification_settings;
    DROP TABLE IF EXISTS contacts;
    ALTER TABLE conversations DROP COLUMN IF EXISTS last_message_id;
    ALTER TABLE conversations DROP COLUMN IF EXISTS last_message_at;
    ALTER TABLE conversations DROP COLUMN IF EXISTS updated_at;
    ALTER TABLE conversation_members DROP COLUMN IF EXISTS unread_count;
    ALTER TABLE conversation_members DROP COLUMN IF EXISTS last_read_message_id;
  `;
  db.runSql(sql, callback);
};

exports._meta = {
  "version": 1
};
