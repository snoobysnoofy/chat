import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { socketService } from '../../services/socketService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Conversation, Message, TypingUser } from '../../types';
import api from '../../utils/api';

interface ChatWindowProps {
  conversation: Conversation;
  onUpdateConversations: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation: initialConversation, onUpdateConversations }) => {
  const { user, logout } = useAuth();
  const [conversation, setConversation] = useState<Conversation>(initialConversation);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Message[]>(`/messages/conversations/${conversation.id}/messages`);
      setMessages(response.data);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [conversation.id, logout]);

  const joinConversation = useCallback(() => {
    socketService.joinConversation(conversation.id);
  }, [conversation.id]);

  const leaveConversation = useCallback(() => {
    socketService.leaveConversation(conversation.id);
  }, [conversation.id]);

  const handleNewMessage = useCallback((message: Message) => {
    if (message.conversation_id === conversation.id) {
      setMessages(prev => [...prev, message]);
      onUpdateConversations();
    }
  }, [conversation.id, onUpdateConversations]);

  const handleUserTyping = useCallback((data: TypingUser) => {
    if (data.conversationId === conversation.id && data.userId !== user?.id) {
      setTypingUsers(prev => {
        const exists = prev.find(u => u.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    }
  }, [conversation.id, user?.id]);

  const handleUserStopTyping = useCallback((data: { userId: number; conversationId: number }) => {
    if (data.conversationId === conversation.id) {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    }
  }, [conversation.id]);

  const handleUserOnline = useCallback((userId: number) => {
    if (userId === conversation.other_user_id) {
      setConversation(prev => ({ ...prev, other_user_online: true }));
    }
  }, [conversation.other_user_id]);

  const handleUserOffline = useCallback((userId: number) => {
    if (userId === conversation.other_user_id) {
      setConversation(prev => ({ 
        ...prev, 
        other_user_online: false, 
        other_user_last_seen: new Date().toISOString() 
      }));
    }
  }, [conversation.other_user_id]);

  useEffect(() => {
    loadMessages();
    joinConversation();

    // Set up socket listeners
    socketService.on('newMessage', handleNewMessage);
    socketService.on('userTyping', handleUserTyping);
    socketService.on('userStopTyping', handleUserStopTyping);
    socketService.on('userOnline', handleUserOnline);
    socketService.on('userOffline', handleUserOffline);

    return () => {
      leaveConversation();
      socketService.off('newMessage', handleNewMessage);
      socketService.off('userTyping', handleUserTyping);
      socketService.off('userStopTyping', handleUserStopTyping);
      socketService.off('userOnline', handleUserOnline);
      socketService.off('userOffline', handleUserOffline);
    };
  }, [conversation.id, loadMessages, joinConversation, leaveConversation, handleNewMessage, handleUserTyping, handleUserStopTyping, handleUserOnline, handleUserOffline]);

  useEffect(() => {
    setConversation(initialConversation);
  }, [initialConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    try {
      // Send via socket only - the socket handler will save to DB and broadcast
      socketService.sendMessage(conversation.id, content, conversation.other_user_id);
      onUpdateConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTypingStart = () => {
    socketService.startTyping(conversation.id);
  };

  const handleTypingStop = () => {
    socketService.stopTyping(conversation.id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Hidden on mobile (mobile header is in ChatDashboard) */}
      <div className="hidden md:block glass-dark border-b border-dark-600 px-6 py-4 flex-shrink-0">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="relative">
              {conversation.other_user_avatar ? (
                <img
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-dark-500"
                  src={conversation.other_user_avatar}
                  alt={conversation.other_user_name}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-message flex items-center justify-center ring-2 ring-dark-500">
                  <span className="text-sm font-medium text-white">
                    {getInitials(conversation.other_user_name)}
                  </span>
                </div>
              )}
              
              {conversation.other_user_online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-dark-700 rounded-full"></div>
              )}
            </div>
          </div>
          
          <div className="ml-3">
            <h2 className="text-lg font-medium text-white">
              {conversation.other_user_name}
            </h2>
            <p className="text-sm text-gray-300">
              {conversation.other_user_online ? 'Online' : 'Offline'}
            </p>
          </div>
          
          <div className="ml-auto">
            <button
              onClick={logout}
              className="text-gray-300 hover:text-white px-3 py-1 text-sm hover:bg-dark-600 rounded transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gradient-chat scrollbar-thin min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-messenger-blue"></div>
          </div>
        ) : (
          <>
            <MessageList messages={messages} currentUserId={user?.id || 0} />
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="px-6 py-2">
                <div className="glass-dark rounded-lg px-4 py-2 max-w-xs shadow-message">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">
                      {typingUsers[0].userName} is typing
                    </span>
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
