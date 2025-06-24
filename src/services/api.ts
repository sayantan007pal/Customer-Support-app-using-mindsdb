import type { ChatRequest, ChatResponse, KnowledgeBaseEntry, SearchFilters } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class APIError extends Error {
  status: number;
  details?: string[];
  
  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      response.status,
      errorData.error || `HTTP ${response.status}`,
      errorData.details
    );
  }
  
  const result = await response.json();
  
  // If the response has a data property (backend wraps responses), return the data
  if (result.success && result.data) {
    return result.data;
  }
  
  // Otherwise return the response as-is
  return result;
}

export const chatAPI = {
  /**
   * Send a message to the chatbot
   */
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    return handleResponse<ChatResponse>(response);
  },

  /**
   * Get conversation history
   */
  getConversation: async (conversationId: string): Promise<{
    conversation_id: string;
    messages: any[];
    total: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/chat/conversation/${conversationId}`);
    return handleResponse(response);
  },

  /**
   * Get user conversations
   */
  getUserConversations: async (userId: string): Promise<{
    user_id: string;
    conversations: string[];
    total: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/chat/user/${userId}/conversations`);
    return handleResponse(response);
  },

  /**
   * Clear/delete a conversation
   */
  clearConversation: async (conversationId: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/chat/conversation/${conversationId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  /**
   * Get chat service statistics
   */
  getStats: async (): Promise<{
    total_conversations: number;
    total_messages: number;
    average_messages_per_conversation: number;
    escalation_rate: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/chat/stats`);
    return handleResponse(response);
  },
};

export const knowledgeBaseAPI = {
  /**
   * Search the knowledge base
   */
  search: async (query: string, filters?: SearchFilters): Promise<{
    query: string;
    results: KnowledgeBaseEntry[];
    total: number;
    filters: SearchFilters;
  }> => {
    const params = new URLSearchParams({ q: query });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(`${API_BASE_URL}/kb/search?${params}`);
    return handleResponse(response);
  },

  /**
   * Add a new knowledge base entry
   */
  addEntry: async (entry: Omit<KnowledgeBaseEntry, 'id' | 'last_updated'>): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/kb/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    return handleResponse(response);
  },

  /**
   * Update a knowledge base entry
   */
  updateEntry: async (
    id: string,
    updates: Partial<Omit<KnowledgeBaseEntry, 'id'>>
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/kb/entries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  /**
   * Delete a knowledge base entry
   */
  deleteEntry: async (id: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await fetch(`${API_BASE_URL}/kb/entries/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  /**
   * Get available categories
   */
  getCategories: async (): Promise<{
    categories: string[];
    total: number;
  }> => {
    const response = await fetch(`${API_BASE_URL}/kb/categories`);
    return handleResponse(response);
  },

  /**
   * Get knowledge base statistics
   */
  getStats: async (): Promise<{
    total_entries: number;
    by_category: Record<string, number>;
    by_priority: Record<string, number>;
  }> => {
    const response = await fetch(`${API_BASE_URL}/kb/stats`);
    return handleResponse(response);
  },
};

export { APIError };
