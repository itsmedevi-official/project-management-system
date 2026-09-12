const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const DB_TYPE = process.env.DB_TYPE || 'mysql';

let mysqlPool = null;
let sqliteDb = null;

if (DB_TYPE === 'mysql') {
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'project_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
  });
  console.log('Using MySQL database driver connected to:', process.env.DB_NAME || 'project_management');
} else {
  const dbPath = path.resolve(__dirname, '../../', process.env.DATABASE_FILE || './database.sqlite');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Failed to connect to SQLite database:', err.message);
    else console.log('Using SQLite database at:', dbPath);
  });
}

// Unified query helpers supporting both MySQL & SQLite
const query = async (sql, params = []) => {
  if (DB_TYPE === 'mysql') {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

const get = async (sql, params = []) => {
  if (DB_TYPE === 'mysql') {
    const [rows] = await mysqlPool.execute(sql, params);
    return rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

const run = async (sql, params = []) => {
  if (DB_TYPE === 'mysql') {
    const [result] = await mysqlPool.execute(sql, params);
    return { lastID: result.insertId, changes: result.affectedRows };
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

const initDB = async () => {
  if (DB_TYPE === 'mysql') {
    console.log('MySQL Database ready.');
  } else {
    await run('PRAGMA foreign_keys = ON;');
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_name TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK(status IN ('Not Started', 'In Progress', 'Completed')) NOT NULL DEFAULT 'Not Started',
        start_date DATE,
        end_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    await run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        task_name TEXT NOT NULL,
        description TEXT,
        priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) NOT NULL DEFAULT 'Medium',
        status TEXT CHECK(status IN ('Pending', 'In Progress', 'Completed')) NOT NULL DEFAULT 'Pending',
        due_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    console.log('SQLite Database ready.');
  }
};

module.exports = {
  query,
  get,
  run,
  initDB
};
