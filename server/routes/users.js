const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Search for users (for starting new conversations)
router.get('/search', authenticateToken, (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  const db = getDatabase();
  const searchTerm = `%${q.trim()}%`;

  db.all(
    `SELECT id, username, email, avatar_url, is_online, last_seen 
     FROM users 
     WHERE (username LIKE ? OR email LIKE ?) AND id != ?
     ORDER BY username
     LIMIT 20`,
    [searchTerm, searchTerm, req.user.id],
    (err, users) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Search failed' });
      }

      res.json(users);
    }
  );
});

// Get user profile by ID
router.get('/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  const db = getDatabase();

  db.get(
    'SELECT id, username, email, avatar_url, is_online, last_seen FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    }
  );
});

// Update current user's profile
router.put('/me', authenticateToken, (req, res) => {
  const { username, avatar_url } = req.body;
  const db = getDatabase();

  // Build dynamic query based on provided fields
  const updates = [];
  const values = [];

  if (username !== undefined) {
    if (!username || username.trim().length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters' });
    }
    updates.push('username = ?');
    values.push(username.trim());
  }

  if (avatar_url !== undefined) {
    updates.push('avatar_url = ?');
    values.push(avatar_url);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.user.id);

  db.run(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        console.error('Database error:', err);
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ error: 'Username already taken' });
        }
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      // Return updated user data
      db.get(
        'SELECT id, email, username, avatar_url, created_at, last_seen, is_online FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Profile updated but failed to retrieve data' });
          }

          res.json(user);
        }
      );
    }
  );
});

// Get online users
router.get('/online/list', authenticateToken, (req, res) => {
  const db = getDatabase();

  db.all(
    `SELECT id, username, avatar_url, last_seen 
     FROM users 
     WHERE is_online = TRUE AND id != ?
     ORDER BY username`,
    [req.user.id],
    (err, users) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch online users' });
      }

      res.json(users);
    }
  );
});

module.exports = router;
