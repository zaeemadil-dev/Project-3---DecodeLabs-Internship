const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const dataFolder = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataFolder, { recursive: true });

const db = new DatabaseSync(path.join(dataFolder, 'contacts.db'));
db.exec('PRAGMA foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    phone TEXT DEFAULT '',
    category TEXT DEFAULT 'Personal',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
