const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Store socket.io instance for broadcasting
let io = null;

const setSocketIO = (socketInstance) => {
  io = socketInstance;
};

// Get all conversations for the current user
router.get('/conversations', authenticateToken, (req, res) => {
  const db = getDatabase();

  const query = `
    SELECT 
      c.id,
      c.created_at,
      c.updated_at,
      u.id as other_user_id,
      u.username as other_user_name,
      u.avatar_url as other_user_avatar,
      u.is_online as other_user_online,
      u.last_seen as other_user_last_seen,
      m.content as last_message,
      m.created_at as last_message_time,
      m.sender_id as last_message_sender_id,
      sender.username as last_message_sender_name
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id != ?
    JOIN users u ON cp2.user_id = u.id
    LEFT JOIN messages m ON c.id = m.conversation_id 
      AND m.id = (
        SELECT MAX(id) FROM messages 
        WHERE conversation_id = c.id AND is_deleted = FALSE
      )
    LEFT JOIN users sender ON m.sender_id = sender.id
    WHERE cp.user_id = ?
    ORDER BY COALESCE(m.created_at, c.created_at) DESC
  `;

  db.all(query, [req.user.id, req.user.id], (err, conversations) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    res.json(conversations);
  });
});

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', authenticateToken, (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const db = getDatabase();

  // First, verify user is part of this conversation
  db.get(
    'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, req.user.id],
    (err, participant) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!participant) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      // Get messages
      const query = `
        SELECT 
          m.id,
          m.content,
          m.message_type,
          m.created_at,
          m.edited_at,
          m.sender_id,
          u.username as sender_name,
          u.avatar_url as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ? AND m.is_deleted = FALSE
        ORDER BY m.created_at DESC
        LIMIT ? OFFSET ?
      `;

      db.all(query, [conversationId, limit, offset], (err, messages) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to fetch messages' });
        }

        // Reverse to get chronological order (oldest first)
        res.json(messages.reverse());
      });
    }
  );
});

// Send a new message
router.post('/conversations/:conversationId/messages', authenticateToken, (req, res) => {
  const { conversationId } = req.params;
  const { content, message_type = 'text' } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const db = getDatabase();

  // Verify user is part of this conversation
  db.get(
    'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
    [conversationId, req.user.id],
    (err, participant) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!participant) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      // Insert message
      db.run(
        'INSERT INTO messages (conversation_id, sender_id, content, message_type, created_at) VALUES (?, ?, ?, ?, ?)',
        [conversationId, req.user.id, content.trim(), message_type, new Date().toISOString()],
        function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to send message' });
          }

          // Update conversation timestamp
          db.run(
            'UPDATE conversations SET updated_at = ? WHERE id = ?',
            [new Date().toISOString(), conversationId]
          );

          // Get the complete message data to return
          db.get(
            `SELECT 
              m.id, m.content, m.message_type, m.created_at, m.sender_id,
              u.username as sender_name, u.avatar_url as sender_avatar
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.id = ?`,
            [this.lastID],
            (err, message) => {
              if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Message sent but failed to retrieve' });
              }

              // Broadcast message via socket.io if available
              if (io) {
                const messageWithConversationId = {
                  ...message,
                  conversation_id: parseInt(conversationId)
                };

                // Broadcast to conversation room
                io.to(`conversation_${conversationId}`).emit('newMessage', messageWithConversationId);

                // Also get all participants of this conversation and send to their personal rooms
                db.all(
                  'SELECT user_id FROM conversation_participants WHERE conversation_id = ?',
                  [conversationId],
                  (err, participants) => {
                    if (!err && participants) {
                      participants.forEach(participant => {
                        io.to(`user_${participant.user_id}`).emit('newMessage', messageWithConversationId);
                        console.log(`Message sent to user ${participant.user_id} personal room`);
                      });
                    }
                  }
                );

                console.log(`Message ${this.lastID} broadcasted via HTTP route to conversation ${conversationId}`);
              }

              res.status(201).json(message);
            }
          );
        }
      );
    }
  );
});

// Create a new conversation with another user
router.post('/conversations', authenticateToken, (req, res) => {
  const { otherUserId } = req.body;

  if (!otherUserId) {
    return res.status(400).json({ error: 'Other user ID is required' });
  }

  if (otherUserId === req.user.id) {
    return res.status(400).json({ error: 'Cannot create conversation with yourself' });
  }

  const db = getDatabase();

  // Check if conversation already exists between these users
  const checkQuery = `
    SELECT c.id 
    FROM conversations c
    JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = ? AND cp2.user_id = ?
    AND (
      SELECT COUNT(*) FROM conversation_participants 
      WHERE conversation_id = c.id
    ) = 2
  `;

  db.get(checkQuery, [req.user.id, otherUserId], (err, existingConversation) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (existingConversation) {
      return res.status(400).json({ 
        error: 'Conversation already exists',
        conversationId: existingConversation.id
      });
    }

    // Verify other user exists
    db.get('SELECT id, username FROM users WHERE id = ?', [otherUserId], (err, otherUser) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!otherUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create new conversation
      db.run('INSERT INTO conversations (created_at, updated_at) VALUES (?, ?)', 
        [new Date().toISOString(), new Date().toISOString()], function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create conversation' });
        }

        const conversationId = this.lastID;
        const now = new Date().toISOString();

        // Add both users as participants
        const insertParticipants = `
          INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES 
          (?, ?, ?), (?, ?, ?)
        `;

        db.run(insertParticipants, [conversationId, req.user.id, now, conversationId, otherUserId, now], (err) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to add participants' });
          }

          const conversationData = {
            id: conversationId,
            other_user_id: otherUser.id,
            other_user_name: otherUser.username,
            created_at: now
          };

          // Broadcast new conversation to the other user
          if (io) {
            io.to(`user_${otherUserId}`).emit('newConversation', {
              ...conversationData,
              other_user_id: req.user.id,
              other_user_name: req.user.username
            });
          }

          res.status(201).json(conversationData);
        });
      });
    });
  });
});

// Delete a message (soft delete)
router.delete('/messages/:messageId', authenticateToken, (req, res) => {
  const { messageId } = req.params;
  const db = getDatabase();

  // Verify user owns this message
  db.get(
    'SELECT id FROM messages WHERE id = ? AND sender_id = ?',
    [messageId, req.user.id],
    (err, message) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!message) {
        return res.status(404).json({ error: 'Message not found or access denied' });
      }

      // Soft delete the message
      db.run(
        'UPDATE messages SET is_deleted = TRUE WHERE id = ?',
        [messageId],
        (err) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete message' });
          }

          res.json({ message: 'Message deleted successfully' });
        }
      );
    }
  );
});

module.exports = { router, setSocketIO };
