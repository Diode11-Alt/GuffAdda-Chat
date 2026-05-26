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
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX idx_conversation_members_user_id ON conversation_members(user_id);
  `;
  db.runSql(sql, callback);
};

exports.down = function(db, callback) {
  const sql = `
    DROP INDEX IF EXISTS idx_users_email;
    DROP INDEX IF EXISTS idx_messages_conversation_id;
    DROP INDEX IF EXISTS idx_conversation_members_user_id;
  `;
  db.runSql(sql, callback);
};

exports._meta = {
  "version": 1
};
