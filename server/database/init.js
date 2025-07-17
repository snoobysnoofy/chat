const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;
let isPostgreSQL = false;

// Check if we should use PostgreSQL (production) or SQLite (development)
if (process.env.DATABASE_URL) {
  // Use PostgreSQL in production
  try {
    const { Pool } = require('pg');
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    isPostgreSQL = true;
    console.log('Using PostgreSQL database');
  } catch (error) {
    console.error('PostgreSQL not available, falling back to SQLite:', error.message);
    setupSQLite();
  }
} else {
  setupSQLite();
}

function setupSQLite() {
  const dbPath = path.join(__dirname, 'messenger.db');
  db = new sqlite3.Database(dbPath);
  isPostgreSQL = false;
  console.log('Using SQLite database');
}

const createSQLiteTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          username TEXT NOT NULL,
          avatar_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_online BOOLEAN DEFAULT FALSE
        )
      `);

      // Conversations table
      db.run(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Conversation participants table (many-to-many relationship)
      db.run(`
        CREATE TABLE IF NOT EXISTS conversation_participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(conversation_id, user_id)
        )
      `);

      // Messages table
      db.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id INTEGER NOT NULL,
          sender_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          message_type TEXT DEFAULT 'text',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          edited_at DATETIME,
          is_deleted BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (conversation_id) REFERENCES conversations (id),
          FOREIGN KEY (sender_id) REFERENCES users (id)
        )
      `);

      // Message status table (for read receipts, delivery status)
      db.run(`
        CREATE TABLE IF NOT EXISTS message_status (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'sent', -- sent, delivered, read
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (message_id) REFERENCES messages (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(message_id, user_id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating SQLite tables:', err);
          reject(err);
        } else {
          console.log('SQLite database initialized successfully');
          resolve();
        }
      });
    });
  });
};

const createPostgreSQLTables = async () => {
  try {
    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        username VARCHAR(100) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        is_online BOOLEAN DEFAULT FALSE
      )
    `);

    // Conversations table
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Conversation participants table
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(conversation_id, user_id)
      )
    `);

    // Messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id),
        sender_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        edited_at TIMESTAMPTZ,
        is_deleted BOOLEAN DEFAULT FALSE
      )
    `);

    // Message status table
    await db.query(`
      CREATE TABLE IF NOT EXISTS message_status (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES messages(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'sent',
        timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id)
      )
    `);

    console.log('PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Error creating PostgreSQL tables:', error);
    throw error;
  }
};

const initDatabase = () => {
  if (isPostgreSQL) {
    return createPostgreSQLTables();
  } else {
    return createSQLiteTables();
  }
};

const getDatabase = () => db;

const closeDatabase = () => {
  if (isPostgreSQL) {
    return db.end();
  } else {
    return new Promise((resolve) => {
      db.close((err) => {
        if (err) {
          console.error('Error closing SQLite database:', err);
        }
        resolve();
      });
    });
  }
};

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  isPostgreSQL
};
