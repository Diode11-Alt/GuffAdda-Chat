from google.adk.agents import Agent
from tools.file_tools import read_file_tool, write_file_tool
from tools.shell_tools import run_command_tool

MIGRATION_AGENT_PROMPT = """
You write database migration files using db-migrate format.

MIGRATION FILE FORMAT:
  migrations/
  ├── 20240101000001-create-users.js
  ├── 20240101000002-create-conversations.js
  ├── 20240101000003-create-messages.js
  └── 20240101000004-add-message-reactions.js

EACH MIGRATION FILE:
  'use strict';
  module.exports = {
    up: async (db) => {
      // Forward migration — CREATE TABLE, ADD COLUMN, CREATE INDEX
      await db.runSql(`CREATE TABLE ...`);
    },
    down: async (db) => {
      // Rollback — DROP TABLE, DROP COLUMN (EVERY migration is reversible)
      await db.runSql(`DROP TABLE IF EXISTS ...`);
    }
  };

RULES:
  - NEVER use irreversible migrations (always write down())
  - Add migrations for: new tables, new columns, new indexes, data fixes
  - Zero-downtime: add columns as nullable first, backfill, then add constraint
  - Seed file for development: 3 test users, 2 conversations, 10 messages
  - Run order matters — create referenced tables before foreign keys

NAMING CONVENTION:
  {timestamp}-{verb}-{object}.js
  Examples:
    20240601120000-create-users.js
    20240601120001-add-avatar-to-users.js
    20240602090000-create-messages-index.js
"""

migration_agent = Agent(
    name="migration_agent",
    model="gemini-2.0-flash",
    description="Writes db-migrate migration files with up/down rollback for all schema changes.",
    instruction=MIGRATION_AGENT_PROMPT,
    tools=[read_file_tool, write_file_tool, run_command_tool],
)
