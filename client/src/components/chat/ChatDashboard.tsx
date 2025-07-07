import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import UserSearch from './UserSearch';
import { Conversation } from '../../types';
import api from '../../utils/api';
import { socketService } from '../../services/socketService';

const ChatDashboard: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);

  useEffect(() => {
    loadConversations();

    // Set up socket listeners for online status updates
    const handleUserOnline = (userId: number) => {
      setConversations(prev => prev.map(conv => 
        conv.other_user_id === userId 
          ? { ...conv, other_user_online: true }
          : conv
      ));
    };

    const handleUserOffline = (userId: number) => {
      setConversations(prev => prev.map(conv => 
        conv.other_user_id === userId 
          ? { ...conv, other_user_online: false, other_user_last_seen: new Date().toISOString() }
          : conv
      ));
    };

    // Handle new messages - update conversation list in real-time
    const handleNewMessage = async (message: any) => {
      setConversations(prev => {
        const existingConvIndex = prev.findIndex(conv => conv.id === message.conversation_id);
        
        if (existingConvIndex >= 0) {
          // Update existing conversation
          const updatedConversations = [...prev];
          updatedConversations[existingConvIndex] = {
            ...updatedConversations[existingConvIndex],
            last_message: message.content,
            last_message_time: message.created_at,
            last_message_sender_id: message.sender_id,
            last_message_sender_name: message.sender_name,
            updated_at: message.created_at
          };
          
          // Move updated conversation to top
          const [updatedConv] = updatedConversations.splice(existingConvIndex, 1);
          return [updatedConv, ...updatedConversations];
        } else {
          // New conversation - fetch the latest conversation list
          // This will include the new conversation
          loadConversations();
          return prev; // Return current state while loading
        }
      });
    };

    // Handle new conversations
    const handleNewConversation = (conversation: any) => {
      console.log('New conversation created:', conversation);
      // Reload conversations to get the complete conversation data
      loadConversations();
    };

    socketService.on('userOnline', handleUserOnline);
    socketService.on('userOffline', handleUserOffline);
    socketService.on('newMessage', handleNewMessage);
    socketService.on('newConversation', handleNewConversation);

    return () => {
      socketService.off('userOnline', handleUserOnline);
      socketService.off('userOffline', handleUserOffline);
      socketService.off('newMessage', handleNewMessage);
      socketService.off('newConversation', handleNewConversation);
    };
  }, []);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === parseInt(conversationId));
      if (conversation) {
        setSelectedConversation(conversation);
      }
    }
  }, [conversationId, conversations]);

  const loadConversations = async () => {
    try {
      const response = await api.get<Conversation[]>('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    window.history.pushState(null, '', `/chat/${conversation.id}`);
  };

  const handleNewConversation = (conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev]);
    setSelectedConversation(conversation);
    setShowUserSearch(false);
    window.history.pushState(null, '', `/chat/${conversation.id}`);
  };

  const updateConversationList = () => {
    loadConversations();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-chat">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-messenger-blue"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-chat">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-dark-600 glass-dark flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-600">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Chats</h1>
            <button
              onClick={() => setShowUserSearch(true)}
              className="p-2 text-gray-300 hover:text-messenger-blue hover:bg-dark-600 rounded-full transition-all duration-200 hover-lift"
              title="Start new conversation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            onConversationSelect={handleConversationSelect}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onUpdateConversations={updateConversationList}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-chat">
            <div className="text-center glass-dark p-8 rounded-2xl shadow-glass">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-message rounded-full flex items-center justify-center shadow-message">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Welcome to Messenger</h3>
              <p className="text-gray-300 mb-4">Select a conversation to start messaging</p>
              <button
                onClick={() => setShowUserSearch(true)}
                className="px-6 py-3 bg-gradient-message text-white rounded-lg hover:scale-105 transition-all duration-200 shadow-message hover-lift"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Search Modal */}
      {showUserSearch && (
        <UserSearch
          onClose={() => setShowUserSearch(false)}
          onConversationCreated={handleNewConversation}
        />
      )}
    </div>
  );
};

export default ChatDashboard;
