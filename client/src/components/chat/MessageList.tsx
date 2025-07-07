import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.created_at);
    const previousDate = new Date(previousMessage.created_at);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
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

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-message rounded-full flex items-center justify-center shadow-message">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-white">No messages yet</p>
          <p className="text-sm mt-1">Start the conversation by sending a message</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-4">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender_id === currentUserId;
        const previousMessage = index > 0 ? messages[index - 1] : undefined;
        const showDateSeparator = shouldShowDateSeparator(message, previousMessage);

        return (
          <div key={message.id}>
            {/* Date separator */}
            {showDateSeparator && (
              <div className="flex items-center justify-center my-4">
                <div className="glass-dark text-gray-300 text-xs px-3 py-1 rounded-full">
                  {formatDateSeparator(message.created_at)}
                </div>
              </div>
            )}

            {/* Message */}
            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* Avatar for other users */}
                {!isCurrentUser && (
                  <div className="flex-shrink-0">
                    {message.sender_avatar ? (
                      <img
                        className="h-6 w-6 rounded-full object-cover ring-1 ring-dark-500"
                        src={message.sender_avatar}
                        alt={message.sender_name}
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gradient-message flex items-center justify-center ring-1 ring-dark-500">
                        <span className="text-xs font-medium text-white">
                          {getInitials(message.sender_name)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`px-4 py-2 rounded-lg message-bubble shadow-message ${
                    isCurrentUser
                      ? 'bg-gradient-message text-white rounded-br-sm'
                      : 'glass-dark text-white border border-dark-500 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageList;
