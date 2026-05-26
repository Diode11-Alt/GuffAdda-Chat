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
    ALTER TABLE messages 
    ADD COLUMN is_edited BOOLEAN DEFAULT false,
    ADD COLUMN is_pinned BOOLEAN DEFAULT false,
    ADD COLUMN link_preview JSONB DEFAULT NULL,
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;
  `;
  db.runSql(sql, callback);
};

exports.down = function(db, callback) {
  const sql = `
    ALTER TABLE messages
    DROP COLUMN IF EXISTS is_edited,
    DROP COLUMN IF EXISTS is_pinned,
    DROP COLUMN IF EXISTS link_preview,
    DROP COLUMN IF EXISTS updated_at;
  `;
  db.runSql(sql, callback);
};

exports._meta = {
  "version": 1
};
