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
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(10) NOT NULL CHECK (type IN ('direct', 'group')),
      name VARCHAR(100),
      avatar_url TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      disappearing_messages_timer INTEGER
    );
  `;
  db.runSql(sql, callback);
};

exports.down = function(db, callback) {
  db.dropTable('conversations', callback);
};

exports._meta = {
  "version": 1
};
