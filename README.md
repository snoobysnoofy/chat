# Messenger App

A modern, real-time messaging application inspired by Facebook Messenger.

## Features

- 🔐 **User Authentication** - Secure login/signup with JWT tokens
- 💬 **Real-time Messaging** - Instant message delivery with Socket.io
- 📋 **Conversation List** - View and manage active conversations
- 📚 **Message History** - Persistent storage of all conversations
- 🎨 **Modern UI** - Clean, responsive design inspired by Messenger
- ⚡ **Real-time Updates** - Live conversation updates and online status

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **Database**: SQLite (easily upgradeable to PostgreSQL)
- **Authentication**: JWT tokens
- **Real-time**: WebSocket connections

## Quick Start

1. **Install all dependencies:**

   ```bash
   npm run install:all
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

   Or use the convenience script:

   ```bash
   ./start.sh
   ```

3. **Open your browser:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 Network Access (Multi-Device Testing)
## 🌐 Production Deployment

Current deployed domains:
- Client (Netlify): https://teal-klepon-e77184.netlify.app/
- Server (Render): https://chat-f5sg.onrender.com

Environment variables (.env on server):
```
NODE_ENV=production
PORT=5000
JWT_SECRET=<<strong-random-secret>>
CLIENT_URL=https://teal-klepon-e77184.netlify.app
```
Client production env (already set in `client/.env.production`):
```
REACT_APP_API_URL=https://chat-f5sg.onrender.com/api
REACT_APP_SOCKET_URL=https://chat-f5sg.onrender.com
```
For changes, edit those files and rebuild/deploy.


To test real-time messaging across multiple devices:

1. **Find your network IP:**

   ```bash
   ./network-info.sh
   ```

2. **Access from other devices:**

   - Make sure all devices are on the same WiFi network
   - On your phone/tablet/other computer, go to: **http://192.168.72.109:3000**
   - Create separate user accounts on each device
   - Start chatting in real-time!

3. **Troubleshooting network access:**
   - Check firewall settings on your computer
   - Ensure devices are on the same WiFi network
   - Try temporarily disabling firewall if connection fails

## 📱 Network Access

To access the app from other devices on your network:

1. **Find your computer's IP address:**

   ```bash
   # On Linux/macOS
   hostname -I

   # On Windows
   ipconfig
   ```

2. **Access from other devices:**
   - Frontend: http://YOUR_IP:3000
   - Backend API: http://YOUR_IP:5000

Example: If your IP is 192.168.1.100:

- Frontend: http://192.168.1.100:3000
- Backend API: http://192.168.1.100:5000

## ✅ Recent Fixes Applied

### Real-time Messaging & Online Status

- ✅ **Fixed real-time messaging**: Messages now appear instantly for both sender and recipient
- ✅ **Fixed online status indicators**: Users now show as online/offline accurately in real-time
- ✅ **Fixed timestamp issues**: All timestamps now display correctly with proper timezone handling
- ✅ **Improved socket handling**: Better connection management and error handling

### UI Improvements

- ✅ **Modern dark mode**: Complete dark theme with glassmorphism effects
- ✅ **Better animations**: Smooth transitions and hover effects
- ✅ **Enhanced visual indicators**: Improved online status, typing indicators, and message bubbles

## 🧪 Testing the Application

The app is now running successfully! Here's how to test it:

### Step 1: Create User Accounts

1. Open http://localhost:3000 in your browser
2. Click "Sign up" to create a new account
3. Fill in username and password (email no longer required; a placeholder is generated)
4. You'll be automatically logged in

### Step 2: Test Real-time Messaging

1. Open a second browser window/tab in incognito mode
2. Go to http://localhost:3000 and create another user account
3. In the first window, click the "+" button to start a new conversation
4. Search for the second user by username (email is still stored but login now uses username only)
5. Click on the user to start a conversation
6. Send messages back and forth between the two windows
7. Notice real-time delivery and typing indicators!

### Step 3: Test Features

- ✅ Real-time messaging works instantly
- ✅ Typing indicators show when someone is typing
- ✅ Online/offline status indicators
- ✅ Message history persists on refresh
- ✅ Conversation list updates in real-time
- ✅ Responsive design works on mobile

## 🎉 Success!

Your messenger app is fully functional with all requested features!

## Project Structure

```
messenger-app/
├── client/          # React frontend
├── server/          # Node.js backend
├── package.json     # Root package.json for scripts
└── README.md        # This file
```

## Development

- `npm run dev` - Start both frontend and backend in development mode
- `npm run client:dev` - Start only the React frontend
- `npm run server:dev` - Start only the Node.js backend
- `npm run build` - Build the React app for production

## Features Overview

### Authentication

- User registration with username and password (email optional / placeholder)
- Secure login with username + password (email no longer required for login)
- Protected routes and API endpoints

### Messaging

- Real-time message delivery
- Message history persistence
- Conversation management
- Online/offline user status

### UI/UX

- Responsive design for all screen sizes
- Modern, clean interface
- Real-time updates without page refresh
- Message status indicators
