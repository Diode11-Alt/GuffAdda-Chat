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
    CREATE TABLE IF NOT EXISTS message_reactions (
      message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      reaction VARCHAR(50) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      PRIMARY KEY (message_id, user_id, reaction)
    );
  `;
  db.runSql(sql, callback);
};

exports.down = function(db, callback) {
  const sql = `
    DROP TABLE IF EXISTS message_reactions;
  `;
  db.runSql(sql, callback);
};

exports._meta = {
  "version": 1
};
