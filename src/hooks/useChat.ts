import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ChatRequest, ChatResponse } from '../types';
import { chatAPI } from '../services/api';

interface UseChatOptions {
  userId?: string;
  autoScroll?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const { userId, autoScroll = true } = options;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async (content: string): Promise<ChatResponse | null> => {
    if (!content.trim() || isLoading) return null;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setError(null);
    setIsTyping(false);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      content,
      role: 'user',
      timestamp: new Date(),
    };
    addMessage(userMessage);

    try {
      // Show typing indicator
      setIsTyping(true);

      const request: ChatRequest = {
        message: content,
        conversation_id: conversationId || undefined,
        user_id: userId,
        context: {
          previous_messages: messages.slice(-5), // Include last 5 messages for context
        },
      };

      const response = await chatAPI.sendMessage(request);

      // Update conversation ID if this is a new conversation
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        content: response.message,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          confidence: response.confidence,
          sources: response.sources.map(s => s.title),
          category: response.metadata.category,
          priority: response.metadata.priority as 'low' | 'medium' | 'high',
        },
      };
      addMessage(assistantMessage);

      setIsTyping(false);
      return response;
    } catch (err) {
      console.error('Chat error:', err);
      
      let errorMessage = 'Sorry, I encountered an error while processing your message.';
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          return null; // Request was cancelled
        }
        errorMessage = err.message;
      }

      // Add error message
      const errorAssistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        content: errorMessage,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          confidence: 0,
          category: 'error',
          priority: 'high' as const,
        },
      };
      addMessage(errorAssistantMessage);

      setError(errorMessage);
      setIsTyping(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, conversationId, userId, messages, addMessage]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setIsTyping(false);
  }, []);

  const retryLastMessage = useCallback(() => {
    if (messages.length === 0) return;
    
    // Find the last user message
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find(msg => msg.role === 'user');
    
    if (lastUserMessage) {
      // Remove messages after the last user message
      const lastUserIndex = messages.findIndex(msg => msg.id === lastUserMessage.id);
      setMessages(prev => prev.slice(0, lastUserIndex + 1));
      
      // Resend the message
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  const loadConversation = useCallback(async (convId: string) => {
    try {
      setIsLoading(true);
      const conversation = await chatAPI.getConversation(convId);
      
      setConversationId(convId);
      setMessages(conversation.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })));
      setError(null);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    messages,
    isLoading,
    error,
    conversationId,
    isTyping,
    
    // Actions
    sendMessage,
    clearConversation,
    retryLastMessage,
    loadConversation,
    scrollToBottom,
    
    // Refs
    messagesEndRef,
  };
}
