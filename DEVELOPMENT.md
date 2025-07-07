# 🎯 Messenger App - Development Guide

## 🚀 Quick Start

### Option 1: Automatic Setup

```bash
./start.sh
```

### Option 2: Manual Setup

```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

## 📱 Features Implemented

### ✅ User Authentication

- **Registration**: Email, username, and password validation
- **Login**: Secure JWT token-based authentication
- **Auto-login**: Remember user sessions
- **Logout**: Clean session cleanup

### ✅ Real-time Messaging

- **WebSocket Connection**: Socket.io for real-time communication
- **Instant Delivery**: Messages appear immediately
- **Typing Indicators**: See when someone is typing
- **Online Status**: Real-time user presence

### ✅ Conversation Management

- **Conversation List**: View all active chats
- **Message History**: Persistent storage and retrieval
- **User Search**: Find users to start new conversations
- **Last Message Preview**: See latest message in conversation list

### ✅ Modern UI/UX

- **Messenger-inspired Design**: Clean, modern interface
- **Responsive Layout**: Works on all screen sizes
- **Real-time Updates**: No page refresh needed
- **Message Bubbles**: Distinct styling for sent/received messages
- **Timestamps**: Formatted message timestamps
- **Avatar Support**: User profile pictures or initials

## 🛠️ Technology Stack

### Backend

- **Node.js + Express**: RESTful API server
- **Socket.io**: Real-time WebSocket communication
- **SQLite**: Lightweight database (easily upgradeable)
- **JWT**: Secure authentication
- **bcryptjs**: Password hashing

### Frontend

- **React 18 + TypeScript**: Modern React with type safety
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **date-fns**: Date formatting utilities

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token

### Messages

- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/conversations/:id/messages` - Get conversation messages
- `POST /api/messages/conversations/:id/messages` - Send message
- `POST /api/messages/conversations` - Create new conversation
- `DELETE /api/messages/:id` - Delete message

### Users

- `GET /api/users/search?q=query` - Search users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/online/list` - Get online users

## 🔌 WebSocket Events

### Client → Server

- `join_conversation` - Join conversation room
- `leave_conversation` - Leave conversation room
- `send_message` - Send message
- `typing_start` - Start typing
- `typing_stop` - Stop typing

### Server → Client

- `new_message` - New message received
- `user_online` - User came online
- `user_offline` - User went offline
- `user_typing` - User started typing
- `user_stop_typing` - User stopped typing
- `message_error` - Message send error

## 🗃️ Database Schema

### Users Table

- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `username` - Display name
- `avatar_url` - Profile picture URL
- `is_online` - Online status
- `last_seen` - Last activity timestamp

### Conversations Table

- `id` - Primary key
- `created_at` - Creation timestamp
- `updated_at` - Last message timestamp

### Messages Table

- `id` - Primary key
- `conversation_id` - Foreign key to conversations
- `sender_id` - Foreign key to users
- `content` - Message text
- `message_type` - Type of message (text, image, etc.)
- `created_at` - Timestamp
- `is_deleted` - Soft delete flag

### Conversation Participants Table

- `id` - Primary key
- `conversation_id` - Foreign key to conversations
- `user_id` - Foreign key to users
- `joined_at` - When user joined conversation

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Server-side validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content sanitization
- **CORS Configuration**: Secure cross-origin requests

## 🎨 UI Components

### Authentication

- `LoginPage` - User login form
- `RegisterPage` - User registration form

### Chat Interface

- `ChatDashboard` - Main chat layout
- `ConversationList` - List of conversations
- `ChatWindow` - Active conversation view
- `MessageList` - Message history display
- `MessageInput` - Message composition
- `UserSearch` - Find users modal

### Common

- `LoadingSpinner` - Loading indicator
- `AuthProvider` - Authentication context

## 📱 Mobile Responsiveness

The app is fully responsive and works great on:

- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktops (1280px+)

## 🚀 Deployment Ready

The app is production-ready with:

- Environment variable configuration
- Build optimization
- Static asset handling
- Database migrations
- Health check endpoints
- Error handling
- Logging

## 🔄 Future Enhancements

Easy to add:

- 📁 File/image sharing
- 🔔 Push notifications
- 👥 Group conversations
- 📞 Voice/video calls
- 🌙 Dark mode
- 🔍 Message search
- 📊 Message reactions
- 📝 Message editing
- 💾 Message persistence
- 🔐 End-to-end encryption

---

## 🏃‍♂️ Running the App

1. **Start the servers:**

   ```bash
   ./start.sh
   ```

2. **Open your browser:**

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 Network Access

The app now supports network access from other devices! After starting the servers, you can access the app from any device on your network using your computer's IP address.

**To find your IP address:**

```bash
# Linux/macOS
hostname -I

# Windows
ipconfig
```

**Then access from other devices:**

- Frontend: http://YOUR_IP:3000
- Backend API: http://YOUR_IP:5000

Example: http://192.168.1.100:3000

3. **Create accounts and start chatting!**

The app will automatically:

- Install all dependencies
- Initialize the SQLite database
- Start both backend and frontend servers
- Open your default browser to the app

Enjoy your new messenger app! 🎉
