// Types for Customer Support Chatbot

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
    priority?: 'low' | 'medium' | 'high';
  };
}

export interface MindsDBConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
  // MindsDB Cloud or SDK specific settings
  mindsdbCloudEmail?: string;
  mindsdbCloudPassword?: string;
  useCloud?: boolean;
  httpUrl?: string;
}

export interface APIError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, any>;
}

export interface QueryClassification {
  category: string;
  intent: string;
  confidence: number;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}

export interface ResponseGeneration {
  response: string;
  confidence: number;
  reasoning: string;
  requires_escalation: boolean;
}

export interface Agent {
  id: string;
  name: string;
  model: string;
  provider: string;
  api_key?: string;
  knowledge_bases: string[];
  tables: string[];
  prompt_template: string;
  created_at: Date;
  updated_at: Date;
  status: 'active' | 'inactive' | 'error';
}

export interface AgentConfig {
  name: string;
  model: string;
  provider: 'openai' | 'google' | 'anthropic' | 'ollama' | 'nvidia_nim' | 'writer';
  api_key: string;
  include_knowledge_bases?: string[];
  include_tables?: string[];
  prompt_template?: string;
}

export interface AgentQuery {
  question: string;
  agent_name: string;
  context?: Record<string, any>;
}

export interface AgentResponse {
  answer: string;
  confidence: number;
  sources: string[];
  agent_name: string;
  model_used: string;
  reasoning?: string;
  timestamp: Date;
}

export interface AgentCreateRequest {
  name: string;
  model: string;
  provider: string;
  api_key: string;
  knowledge_bases?: string[];
  tables?: string[];
  prompt_template?: string;
}

export interface AgentQueryRequest {
  question: string;
  agent_name: string;
  context?: Record<string, any>;
}
