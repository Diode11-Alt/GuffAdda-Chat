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
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone_number VARCHAR(20) UNIQUE,
      email VARCHAR(255) UNIQUE,
      display_name VARCHAR(100) NOT NULL,
      avatar_url TEXT,
      about TEXT DEFAULT 'Hey there! I am using this app.',
      identity_public_key TEXT NOT NULL,
      signed_prekey_public TEXT NOT NULL,
      signed_prekey_signature TEXT NOT NULL,
      registration_id INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT true,
      last_seen TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  db.runSql(sql, callback);
};

exports.down = function(db, callback) {
  db.dropTable('users', callback);
};

exports._meta = {
  "version": 1
};
