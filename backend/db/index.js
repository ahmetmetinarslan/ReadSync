const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');

dotenv.config();

let dbInstance = null;

function resolveDbPath() {
  const rawPath = process.env.DATABASE_URL || path.join('db', 'database.sqlite');
  return path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(__dirname, '..', rawPath);
}

function ensureCurrentPageColumn(db) {
  const columns = db.prepare('PRAGMA table_info(books)').all();
  const hasCurrentPage = columns.some((column) => column.name === 'current_page');
  if (!hasCurrentPage) {
    db.prepare('ALTER TABLE books ADD COLUMN current_page INTEGER NOT NULL DEFAULT 0').run();
  }
}

function runMigrations(db) {
  const migrationsPath = path.resolve(__dirname, 'migrations.sql');
  const sql = fs.readFileSync(migrationsPath, 'utf-8');
  db.exec(sql);
  ensureCurrentPageColumn(db);
}

function getDb() {
  if (!dbInstance) {
    const dbPath = resolveDbPath();
    dbInstance = new Database(dbPath);
    dbInstance.pragma('foreign_keys = ON');
    runMigrations(dbInstance);
  }
  return dbInstance;
}

module.exports = {
  getDb,
};

