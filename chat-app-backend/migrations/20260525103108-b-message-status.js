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
    CREATE TABLE IF NOT EXISTS message_status (
      message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(10) DEFAULT 'sent' CHECK (status IN ('sent','delivered','read')),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (message_id, user_id)
    );
  `;
  db.runSql(sql, callback);
};

exports.down = function(db, callback) {
  db.dropTable('message_status', callback);
};

exports._meta = {
  "version": 1
};
