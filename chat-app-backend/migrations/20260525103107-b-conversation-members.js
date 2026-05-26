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
    CREATE TABLE IF NOT EXISTS conversation_members (
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(10) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (conversation_id, user_id)
    );
  `;
  db.runSql(sql, callback);
};

exports.down = function(db, callback) {
  db.dropTable('conversation_members', callback);
};

exports._meta = {
  "version": 1
};
