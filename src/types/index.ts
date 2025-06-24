// Types for the frontend application

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    confidence?: number;
    sources?: string[];
    category?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  user_id?: string;
  context?: {
    previous_messages?: ChatMessage[];
    user_preferences?: Record<string, any>;
  };
}

export interface ChatResponse {
  message: string;
  confidence: number;
  sources: KnowledgeBaseEntry[];
  suggested_actions?: string[];
  requires_escalation: boolean;
  conversation_id: string;
  metadata: {
    processing_time: number;
    category: string;
    priority: string;
  };
}

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  content: string;
  category: 'billing' | 'technical' | 'general' | 'shipping' | 'returns';
  priority: 'low' | 'medium' | 'high';
  product_type?: string;
  tags: string[];
  last_updated: Date;
  chunk_content?: string;
  relevance?: number;
  distance?: number;
}

export interface Conversation {
  id: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
  user_id?: string;
  status: 'active' | 'resolved' | 'escalated';
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  preferences?: {
    theme?: 'light' | 'dark';
    language?: string;
    notifications?: boolean;
  };
}

export interface APIError {
  error: string;
  message?: string;
  details?: string[];
}

export interface SearchFilters {
  category?: string;
  priority?: string;
  product_type?: string;
  limit?: number;
  relevance_threshold?: number;
}
