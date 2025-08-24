const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Basic validation (email now optional)
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const db = getDatabase();

    // Helper to generate a placeholder email if none provided
    const generatePlaceholderEmail = (baseName) => {
      const cleaned = baseName.toLowerCase().replace(/[^a-z0-9_\-]/g, '');
      return `${cleaned || 'user'}@placeholder.local`;
    };

    const desiredEmail = email && email.trim() !== '' ? email.trim() : generatePlaceholderEmail(username);

    const checkEmailUniqueAndCreate = (candidateEmail, attempt = 0) => {
      db.get('SELECT id FROM users WHERE email = ?', [candidateEmail], async (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (row) {
          // If user supplied an email explicitly, reject; else try a new placeholder
          if (email) {
            return res.status(400).json({ error: 'User with this email already exists' });
          }
          if (attempt > 10) {
            return res.status(500).json({ error: 'Failed to generate unique placeholder email' });
          }
            const newCandidate = desiredEmail.replace('@', `_${Math.floor(Math.random()*1000)}@`);
            return checkEmailUniqueAndCreate(newCandidate, attempt + 1);
        }

        // Email unique - proceed
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
          'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
          [candidateEmail, hashedPassword, username],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(400).json({ error: 'Username or email already exists' });
              }
              return res.status(500).json({ error: 'Failed to create user' });
            }

            const token = jwt.sign(
              { id: this.lastID, email: candidateEmail, username },
              process.env.JWT_SECRET,
              { expiresIn: '7d' }
            );

            res.status(201).json({
              message: 'User created successfully',
              token,
              user: {
                id: this.lastID,
                email: candidateEmail,
                username,
                avatar_url: null
              }
            });
          }
        );
      });
    };

    checkEmailUniqueAndCreate(desiredEmail);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user (username + password instead of email)
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = getDatabase();

    // Find user by username
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Update last seen and online status
      db.run(
        'UPDATE users SET last_seen = ?, is_online = TRUE WHERE id = ?',
        [new Date().toISOString(), user.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar_url: user.avatar_url
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
  const db = getDatabase();

  db.get(
    'SELECT id, email, username, avatar_url, created_at, last_seen, is_online FROM users WHERE id = ?',
    [req.user.id],
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

// Logout user
router.post('/logout', authenticateToken, (req, res) => {
  const db = getDatabase();

  // Update online status
  db.run(
    'UPDATE users SET is_online = FALSE, last_seen = ? WHERE id = ?',
    [new Date().toISOString(), req.user.id],
    (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.json({ message: 'Logged out successfully' });
    }
  );
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username
    }
  });
});

module.exports = router;
