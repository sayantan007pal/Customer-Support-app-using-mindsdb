import type { ChatMessage } from '../types';

// Simple icon components
const CheckCircleIcon = ({ className }: { className: string }) => (
  <div className={`${className} rounded-full bg-green-500 flex items-center justify-center`}>
    <span className="text-white text-xs">✓</span>
  </div>
);

const ExclamationTriangleIcon = ({ className }: { className: string }) => (
  <div className={`${className} bg-red-500 flex items-center justify-center`}>
    <span className="text-white text-xs">!</span>
  </div>
);

const ClockIcon = ({ className }: { className: string }) => (
  <div className={`${className} bg-yellow-500 rounded-full flex items-center justify-center`}>
    <span className="text-white text-xs">⏱</span>
  </div>
);

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

interface ChatMessageProps {
  message: ChatMessage;
  isTyping?: boolean;
}

export function ChatMessageComponent({ message, isTyping = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.metadata?.category === 'error';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          max-w-xs lg:max-w-md px-4 py-2 rounded-lg break-words
          ${isUser 
            ? 'bg-blue-500 text-white' 
            : isError 
              ? 'bg-red-100 text-red-800 border border-red-300'
              : 'bg-gray-100 text-gray-800'
          }
          ${isTyping ? 'animate-pulse' : ''}
        `}
      >
        {/* Message content */}
        <div className="whitespace-pre-wrap">
          {isTyping ? (
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="ml-2 text-sm text-gray-600">AI is typing...</span>
            </div>
          ) : (
            message.content
          )}
        </div>

        {/* Message metadata */}
        {!isTyping && message.metadata && (
          <div className="mt-2 text-xs opacity-75">
            <div className="flex items-center space-x-2">
              {/* Confidence indicator */}
              {message.metadata.confidence !== undefined && !isUser && (
                <div className="flex items-center space-x-1">
                  {message.metadata.confidence > 0.8 ? (
                    <CheckCircleIcon className="w-3 h-3 text-green-500" />
                  ) : message.metadata.confidence > 0.6 ? (
                    <ClockIcon className="w-3 h-3 text-yellow-500" />
                  ) : (
                    <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />
                  )}
                  <span>
                    {Math.round(message.metadata.confidence * 100)}% confident
                  </span>
                </div>
              )}

              {/* Category and priority */}
              {message.metadata.category && (
                <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                  {message.metadata.category}
                </span>
              )}
              
              {message.metadata.priority && (
                <span 
                  className={`px-2 py-1 rounded text-xs ${
                    message.metadata.priority === 'high' 
                      ? 'bg-red-200 text-red-800'
                      : message.metadata.priority === 'medium'
                        ? 'bg-yellow-200 text-yellow-800' 
                        : 'bg-green-200 text-green-800'
                  }`}
                >
                  {message.metadata.priority}
                </span>
              )}
            </div>

            {/* Sources */}
            {message.metadata.sources && message.metadata.sources.length > 0 && (
              <div className="mt-1">
                <span className="text-xs text-gray-600">
                  Sources: {message.metadata.sources.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        {!isTyping && (
          <div className="mt-1 text-xs opacity-50">
            {formatTimeAgo(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}
