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

function runMigrations(db) {
  const migrationsPath = path.resolve(__dirname, 'migrations.sql');
  const sql = fs.readFileSync(migrationsPath, 'utf-8');
  db.exec(sql);
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

