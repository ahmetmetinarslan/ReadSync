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

function ensureBookColumns(db) {
  const columns = db.prepare('PRAGMA table_info(books)').all();
  const columnNames = new Set(columns.map((column) => column.name));

  const ensureColumn = (name, definition) => {
    if (columnNames.has(name)) {
      return;
    }
    db.prepare(`ALTER TABLE books ADD COLUMN ${name} ${definition}`).run();
    columnNames.add(name);
  };

  ensureColumn('current_page', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('isbn', 'TEXT');
  ensureColumn('cover_url', 'TEXT');
}

function runMigrations(db) {
  const migrationsPath = path.resolve(__dirname, 'migrations.sql');
  const sql = fs.readFileSync(migrationsPath, 'utf-8');
  db.exec(sql);
  ensureBookColumns(db);
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
