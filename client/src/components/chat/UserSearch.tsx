import React, { useState, useEffect, useCallback } from 'react';
import { User, Conversation } from '../../types';
import api from '../../utils/api';

interface UserSearchProps {
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onClose, onConversationCreated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<User[]>(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(response.data);
    } catch (err: any) {
      setError('Failed to search users');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  const createConversation = async (otherUserId: number) => {
    try {
      setLoading(true);
      const response = await api.post<Conversation>('/messages/conversations', {
        otherUserId
      });
      onConversationCreated(response.data);
    } catch (err: any) {
      if (err.response?.data?.conversationId) {
        // Conversation already exists, find it and select it
        const conversationId = err.response.data.conversationId;
        // You might want to emit an event or handle this differently
        console.log('Conversation already exists:', conversationId);
      } else {
        setError('Failed to create conversation');
      }
    } finally {
      setLoading(false);
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="glass-dark rounded-2xl shadow-glass w-full max-w-md mx-4 border border-dark-500">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <h3 className="text-lg font-medium text-white">Start New Conversation</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-dark-600 p-1 rounded-full transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 pb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="username"
              className="block w-full pl-10 pr-3 py-2 bg-dark-700 border border-dark-500 text-white placeholder-gray-400 rounded-lg leading-5 focus:outline-none focus:ring-2 focus:ring-messenger-blue focus:border-transparent transition-all duration-200"
              autoFocus
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-900 bg-opacity-50 border border-red-600 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}

        {/* Search Results */}
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-messenger-blue"></div>
            </div>
          )}

          {!loading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">
              <p>No users found matching "{searchQuery}"</p>
            </div>
          )}

          {!loading && searchQuery.trim().length < 2 && (
            <div className="px-6 py-8 text-center text-gray-400">
              <p>Type at least 2 characters to search for users</p>
            </div>
          )}

          {!loading && searchResults.length > 0 && (
            <div className="divide-y divide-dark-600">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => createConversation(user.id)}
                  className="px-6 py-4 hover:bg-dark-600 cursor-pointer transition-all duration-200 hover-lift"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="relative">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-dark-500"
                            src={user.avatar_url}
                            alt={user.username}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-message flex items-center justify-center ring-2 ring-dark-500">
                            <span className="text-sm font-medium text-white">
                              {getInitials(user.username)}
                            </span>
                          </div>
                        )}
                        
                        {user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-dark-700 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.username}
                      </p>
                      <p className="text-sm text-gray-300 truncate">
                        {user.email}
                      </p>
                      {user.is_online ? (
                        <p className="text-xs text-green-400">Online</p>
                      ) : (
                        <p className="text-xs text-gray-500">Offline</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-600">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-dark-700 border border-dark-500 rounded-lg text-sm font-medium text-gray-300 hover:bg-dark-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-messenger-blue transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
