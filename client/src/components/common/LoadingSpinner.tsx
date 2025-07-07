import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-chat">
      <div className="flex flex-col items-center glass-dark p-8 rounded-2xl shadow-glass">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-messenger-blue"></div>
        <p className="mt-4 text-gray-300">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
