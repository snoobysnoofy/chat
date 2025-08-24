import { io, Socket } from 'socket.io-client';
import { Message, TypingUser } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string): void {
    // Get the server URL from environment variables or fallback to dynamic detection
    const getServerUrl = () => {
      // Use environment variable if available
      if (process.env.REACT_APP_SOCKET_URL) {
        const envUrl = process.env.REACT_APP_SOCKET_URL;
        const accessingViaLan = !['localhost', '127.0.0.1'].includes(window.location.hostname) && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1]))/.test(window.location.hostname);
        const envIsLocalhost = /localhost|127\.0\.0\.1/.test(envUrl);
        if (accessingViaLan && envIsLocalhost) {
          return `http://${window.location.hostname}:5000`;
        }
        return envUrl;
      }
      
      // Production fallback - use same domain as frontend
      if (process.env.NODE_ENV === 'production') {
        return `${window.location.protocol}//${window.location.host}`;
      }
      
      // Development fallback
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
      }
      
      // Network development fallback
      return `http://${window.location.hostname}:5000`;
    };
    
    const SOCKET_URL = getServerUrl();
    console.log(`Connecting to socket server at: ${SOCKET_URL}`);
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.emit('socketConnected', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.emit('socketDisconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.emit('socketError', error);
    });

    // Message events
    this.socket.on('newMessage', (message: Message) => {
      this.emit('newMessage', message);
    });

    // Conversation events
    this.socket.on('newConversation', (conversation: any) => {
      this.emit('newConversation', conversation);
    });

    // User status events
    this.socket.on('user_online', (userId: number) => {
      this.emit('userOnline', userId);
    });

    this.socket.on('user_offline', (userId: number) => {
      this.emit('userOffline', userId);
    });

    // Typing events
    this.socket.on('user_typing', (data: TypingUser) => {
      this.emit('userTyping', data);
    });

    this.socket.on('user_stop_typing', (data: { userId: number; conversationId: number }) => {
      this.emit('userStopTyping', data);
    });

    // Error events
    this.socket.on('message_error', (error: any) => {
      this.emit('messageError', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Join a conversation room
  joinConversation(conversationId: number): void {
    if (this.socket) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId: number): void {
    if (this.socket) {
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  // Send a message
  sendMessage(conversationId: number, content: string, recipientId?: number): void {
    if (this.socket) {
      this.socket.emit('send_message', {
        conversationId,
        content,
        recipientId
      });
    }
  }

  // Typing indicators
  startTyping(conversationId: number): void {
    if (this.socket) {
      this.socket.emit('typing_start', { conversationId });
    }
  }

  stopTyping(conversationId: number): void {
    if (this.socket) {
      this.socket.emit('typing_stop', { conversationId });
    }
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
