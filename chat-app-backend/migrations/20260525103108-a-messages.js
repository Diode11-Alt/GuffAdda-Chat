'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  const sql = `
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id UUID REFERENCES users(id),
      message_type VARCHAR(20) NOT NULL,
      encrypted_payload TEXT NOT NULL,
      iv TEXT NOT NULL,
      reply_to_id UUID REFERENCES messages(id),
      is_deleted BOOLEAN DEFAULT false,
      deleted_for_everyone_at TIMESTAMP WITH TIME ZONE,
      disappears_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at DESC);
  `;
  db.runSql(sql, callback);
};

exports.down = function(db, callback) {
  const sql = `
    DROP INDEX IF EXISTS idx_messages_conversation;
    DROP TABLE IF EXISTS messages;
  `;
  db.runSql(sql, callback);
};

exports._meta = {
  "version": 1
};
