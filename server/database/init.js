const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'messenger.db');
const db = new sqlite3.Database(dbPath);

const initDatabase = () => {
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
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
    });
  });
};

const getDatabase = () => db;

module.exports = {
  initDatabase,
  getDatabase
};
