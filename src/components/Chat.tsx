import { useRef } from 'react';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChat } from '../hooks/useChat';

interface ChatProps {
  userId?: string;
  className?: string;
}

export function Chat({ userId, className = '' }: ChatProps) {
  const { 
    messages, 
    isLoading, 
    error, 
    isTyping, 
    sendMessage, 
    clearConversation,
    messagesEndRef
  } = useChat({ userId });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Welcome message
  // Welcome message effect - currently disabled
  // useEffect(() => {
  //   if (messages.length === 0) {
  //     // Could add welcome message here if needed
  //   }
  // }, []);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Customer Support</h2>
          <p className="text-sm text-gray-600">
            {isTyping ? 'AI is typing...' : 'Ask me anything!'}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={clearConversation}
            className="
              px-3 py-1 text-sm text-gray-600 hover:text-gray-800 
              border border-gray-300 rounded hover:bg-gray-100
              transition-colors duration-200
            "
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2">Welcome to Customer Support</h3>
            <p className="text-sm mb-4">
              I'm here to help you with any questions about our products or services.
            </p>
            <div className="text-xs text-gray-400">
              <p>Try asking:</p>
              <ul className="mt-2 space-y-1">
                <li>"How do I reset my password?"</li>
                <li>"What's your return policy?"</li>
                <li>"I need help with billing"</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessageComponent 
            key={message.id} 
            message={message}
          />
        ))}

        {isTyping && (
          <ChatMessageComponent
            message={{
              id: 'typing',
              content: '',
              role: 'assistant',
              timestamp: new Date(),
            }}
            isTyping={true}
          />
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput 
        onSendMessage={sendMessage}
        disabled={isLoading}
        placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
      />
    </div>
  );
}
