const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { router: messageRoutes, setSocketIO } = require('./routes/messages');
const userRoutes = require('./routes/users');
const { initDatabase } = require('./database/init');
const { authenticateSocket } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Production-ready CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['https://your-domain.com'])
    : ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
};

// Socket.io with production CORS
const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

const PORT = process.env.PORT || 5000;

// Production rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More restrictive in production
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Security headers middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss:;");
  }
  next();
});

// Middleware
app.use(limiter);
app.use(cors(corsOptions));
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing - send all non-API requests to React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    }
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  res.json(healthData);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ 
      error: err.message,
      stack: err.stack
    });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Socket.io connection handling
const activeUsers = new Map(); // userId -> socketId

// Set up socket.io instance for message routes
setSocketIO(io);

io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected with socket ${socket.id}`);
  
  // Update user's online status in database
  const { getDatabase } = require('./database/init');
  const db = getDatabase();
  
  db.run(
    'UPDATE users SET is_online = TRUE, last_seen = ? WHERE id = ?',
    [new Date().toISOString(), socket.userId],
    (err) => {
      if (err) {
        console.error('Error updating online status:', err);
      }
    }
  );
  
  // Store user's socket connection
  activeUsers.set(socket.userId, socket.id);
  
  // Notify others that user is online
  socket.broadcast.emit('user_online', socket.userId);
  
  // Join user to their personal room for private messages
  socket.join(`user_${socket.userId}`);
  
  // Handle joining conversation rooms
  socket.on('join_conversation', (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`User ${socket.userId} joined conversation ${conversationId}`);
  });
  
  // Handle leaving conversation rooms
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
    console.log(`User ${socket.userId} left conversation ${conversationId}`);
  });
  
  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, content, recipientId } = data;
      
      // Save message to database using the same route logic
      const { getDatabase } = require('./database/init');
      const db = getDatabase();          // Insert message into database
          db.run(
            'INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES (?, ?, ?, ?)',
            [conversationId, socket.userId, content.trim(), new Date().toISOString()],
            function(err) {
              if (err) {
                console.error('Failed to save message to database:', err);
                socket.emit('message_error', { error: 'Failed to save message' });
                return;
              }

              // Update conversation timestamp
              db.run(
                'UPDATE conversations SET updated_at = ? WHERE id = ?',
                [new Date().toISOString(), conversationId]
              );

          // Get the complete message data with sender info
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
                console.error('Failed to retrieve message:', err);
                return;
              }

              // Broadcast message to all users in the conversation room
              io.to(`conversation_${conversationId}`).emit('newMessage', {
                ...message,
                conversation_id: conversationId
              });

              console.log(`Message ${this.lastID} broadcasted to conversation ${conversationId}`);
            }
          );
        }
      );
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });
  
  // Handle typing indicators
  socket.on('typing_start', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
      userId: socket.userId,
      userName: socket.userName,
      conversationId: data.conversationId
    });
  });
  
  socket.on('typing_stop', (data) => {
    socket.to(`conversation_${data.conversationId}`).emit('user_stop_typing', {
      userId: socket.userId,
      conversationId: data.conversationId
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`);
    
    // Update user's offline status in database
    db.run(
      'UPDATE users SET is_online = FALSE, last_seen = ? WHERE id = ?',
      [new Date().toISOString(), socket.userId],
      (err) => {
        if (err) {
          console.error('Error updating offline status:', err);
        }
      }
    );
    
    activeUsers.delete(socket.userId);
    
    // Notify others that user is offline
    socket.broadcast.emit('user_offline', socket.userId);
  });
});

// Initialize database and start server
initDatabase().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Network access: http://0.0.0.0:${PORT}/api/health`);
    
    // Get local IP address for easier access
    const os = require('os');
    const interfaces = os.networkInterfaces();
    Object.keys(interfaces).forEach(interfaceName => {
      interfaces[interfaceName].forEach(interface => {
        if (interface.family === 'IPv4' && !interface.internal) {
          console.log(`🌐 Access from other devices: http://${interface.address}:${PORT}/api/health`);
        }
      });
    });
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close database connection
    const { closeDatabase } = require('./database/init');
    if (closeDatabase) {
      closeDatabase();
    }
    
    // Close socket.io connections
    io.close(() => {
      console.log('Socket.io connections closed.');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});
