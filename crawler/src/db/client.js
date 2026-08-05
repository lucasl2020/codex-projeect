import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCHEMA_SQL, DEFAULT_SETTINGS } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
export const DATA_DIR = path.join(ROOT, 'data');
export const DB_PATH = path.join(DATA_DIR, 'app.db');

/** @type {import('better-sqlite3').Database | null} */
let db = null;

/**
 * @param {string} [dbPath]
 */
export function getDb(dbPath) {
  if (db && !dbPath) return db;
  const target = dbPath || DB_PATH;
  if (db && db.name === target) return db;
  if (db && dbPath && db.name !== target) {
    db.close();
    db = null;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const instance = new Database(target);
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');
  instance.exec(SCHEMA_SQL);
  migrate(instance);
  seedSettings(instance);
  db = instance;
  return db;
}

function migrate(instance) {
  const cols = instance.prepare('PRAGMA table_info(sites)').all().map((c) => c.name);
  if (!cols.includes('fail_count')) {
    instance.exec('ALTER TABLE sites ADD COLUMN fail_count INTEGER NOT NULL DEFAULT 0');
  }
}

function seedSettings(instance) {
  const insert = instance.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  );
  const tx = instance.transaction(() => {
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      insert.run(k, v);
    }
  });
  tx();
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
