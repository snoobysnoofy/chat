import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Conversation } from '../../types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: number;
  onConversationSelect: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onConversationSelect,
}) => {
  const formatLastSeen = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
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

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <p>No conversations yet</p>
        <p className="text-sm mt-1">Start a new chat to begin messaging</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-dark-600">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onConversationSelect(conversation)}
          className={`p-4 hover:bg-dark-600 cursor-pointer transition-all duration-200 hover-lift ${
            selectedConversationId === conversation.id ? 'bg-dark-600 border-r-4 border-messenger-blue shadow-message' : ''
          }`}
        >
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="relative">
                {conversation.other_user_avatar ? (
                  <img
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-dark-500"
                    src={conversation.other_user_avatar}
                    alt={conversation.other_user_name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-message flex items-center justify-center ring-2 ring-dark-500">
                    <span className="text-sm font-medium text-white">
                      {getInitials(conversation.other_user_name)}
                    </span>
                  </div>
                )}
                
                {/* Online indicator */}
                {conversation.other_user_online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-dark-700 rounded-full"></div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white truncate">
                  {conversation.other_user_name}
                </h3>
                {conversation.last_message_time && (
                  <span className="text-xs text-gray-400">
                    {formatLastSeen(conversation.last_message_time)}
                  </span>
                )}
              </div>
              
              {conversation.last_message ? (
                <p className="text-sm text-gray-300 truncate mt-1">
                  {conversation.last_message_sender_name === conversation.other_user_name 
                    ? conversation.last_message
                    : `You: ${conversation.last_message}`
                  }
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic mt-1">
                  No messages yet
                </p>
              )}
              
              {!conversation.other_user_online && conversation.other_user_last_seen && (
                <p className="text-xs text-gray-500 mt-1">
                  Last seen {formatLastSeen(conversation.other_user_last_seen)}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
