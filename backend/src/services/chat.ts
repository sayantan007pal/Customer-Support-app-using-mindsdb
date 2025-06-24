import type { ChatRequest, ChatResponse, ChatMessage } from '../types/index.js';
import { KnowledgeBaseService } from './knowledgeBase.js';
import { AIService } from './ai.js';

export class ChatService {
  private knowledgeBaseService: KnowledgeBaseService;
  private aiService: AIService;
  private conversations: Map<string, ChatMessage[]>;

  constructor(
    knowledgeBaseService?: KnowledgeBaseService,
    aiService?: AIService
  ) {
    this.knowledgeBaseService = knowledgeBaseService || new KnowledgeBaseService();
    this.aiService = aiService || new AIService();
    this.conversations = new Map();
  }

  /**
   * Process a user message and generate an appropriate response
   */
  async processMessage(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    
    try {
      // Generate conversation ID if not provided
      const conversationId = request.conversation_id || this.generateConversationId();
      
      // Step 1: Classify the query
      const classification = await this.aiService.classifyQuery(request.message);
      
      // Step 2: Search knowledge base (using SDK if available)
      const searchFilters = {
        category: classification.category !== 'general' ? classification.category : undefined,
        limit: 5,
        relevance_threshold: 0.7
      };
      
      const knowledgeBaseResults = await this.knowledgeBaseService.searchKnowledgeBaseWithSDK(
        request.message,
        searchFilters
      );
      
      // Step 3: Generate response using AI
      const generationResult = await this.aiService.generateResponse(
        request.message,
        knowledgeBaseResults,
        classification
      );
      
      // Step 4: Determine if escalation is needed
      const requiresEscalation = await this.aiService.shouldEscalate(
        request.message,
        classification,
        generationResult
      );
      
      // Step 5: Get suggested actions
      const suggestedActions = this.aiService.getSuggestedActions(
        classification,
        generationResult,
        requiresEscalation
      );
      
      // Step 6: Build response
      const processingTime = Date.now() - startTime;
      const response: ChatResponse = {
        message: generationResult.response,
        confidence: generationResult.confidence,
        sources: knowledgeBaseResults,
        suggested_actions: suggestedActions,
        requires_escalation: requiresEscalation,
        conversation_id: conversationId,
        metadata: {
          processing_time: processingTime,
          category: classification.category,
          priority: this.determinePriority(classification, requiresEscalation) as 'low' | 'medium' | 'high'
        }
      };
      
      // Step 7: Save messages to conversation history
      await this.saveMessage(conversationId, {
        id: `msg_${Date.now()}_user`,
        content: request.message,
        role: 'user',
        timestamp: new Date()
      });
      
      await this.saveMessage(conversationId, {
        id: `msg_${Date.now()}_assistant`,
        content: response.message,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          confidence: response.confidence,
          sources: response.sources.map(s => s.title),
          category: classification.category,
          priority: this.determinePriority(classification, response.requires_escalation) as 'low' | 'medium' | 'high'
        }
      });
      
      return response;
    } catch (error) {
      console.error('Chat processing failed:', error);
      throw new Error(`Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get conversation history for a given conversation ID
   */
  async getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
    try {
      return this.conversations.get(conversationId) || [];
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Save a message to conversation history
   */
  async saveMessage(conversationId: string, message: ChatMessage): Promise<boolean> {
    try {
      const messages = this.conversations.get(conversationId) || [];
      messages.push(message);
      this.conversations.set(conversationId, messages);
      
      // In a real implementation, you would save to a persistent database
      // For now, we're using in-memory storage
      
      return true;
    } catch (error) {
      console.error('Failed to save message:', error);
      return false;
    }
  }

  /**
   * Get active conversations for a user
   */
  async getUserConversations(userId: string): Promise<string[]> {
    try {
      // In a real implementation, you would query a database
      // For now, return conversation IDs that contain the user's messages
      const userConversations: string[] = [];
      
      for (const [conversationId, messages] of this.conversations.entries()) {
        // Check if any message in this conversation is from this user
        const hasUserMessage = messages.some(msg => 
          msg.role === 'user' // In a real app, you'd check user_id
        );
        
        if (hasUserMessage) {
          userConversations.push(conversationId);
        }
      }
      
      return userConversations;
    } catch (error) {
      console.error('Failed to get user conversations:', error);
      return [];
    }
  }

  /**
   * Clear conversation history (for testing or privacy)
   */
  async clearConversation(conversationId: string): Promise<boolean> {
    try {
      this.conversations.delete(conversationId);
      return true;
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      return false;
    }
  }

  /**
   * Generate a unique conversation ID
   */
  private generateConversationId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    return `conv_${timestamp}_${randomSuffix}`;
  }

  /**
   * Determine message priority based on classification and escalation need
   */
  private determinePriority(
    classification: { category: string; confidence: number },
    requiresEscalation: boolean
  ): string {
    if (requiresEscalation) return 'high';
    
    const highPriorityCategories = ['billing', 'refund', 'complaint'];
    if (highPriorityCategories.includes(classification.category)) return 'high';
    
    const mediumPriorityCategories = ['technical', 'shipping', 'returns'];
    if (mediumPriorityCategories.includes(classification.category)) return 'medium';
    
    return 'low';
  }

  /**
   * Get conversation statistics
   */
  async getStats(): Promise<{
    total_conversations: number;
    total_messages: number;
    average_messages_per_conversation: number;
    escalation_rate: number;
  }> {
    try {
      const totalConversations = this.conversations.size;
      let totalMessages = 0;
      let escalatedConversations = 0;
      
      for (const messages of this.conversations.values()) {
        totalMessages += messages.length;
        
        // Check if any assistant message in this conversation suggested escalation
        const hasEscalation = messages.some(msg => 
          msg.role === 'assistant' && 
          msg.metadata?.category === 'escalation'
        );
        
        if (hasEscalation) escalatedConversations++;
      }
      
      return {
        total_conversations: totalConversations,
        total_messages: totalMessages,
        average_messages_per_conversation: totalConversations > 0 
          ? Math.round((totalMessages / totalConversations) * 100) / 100 
          : 0,
        escalation_rate: totalConversations > 0 
          ? Math.round((escalatedConversations / totalConversations) * 100) / 100 
          : 0
      };
    } catch (error) {
      console.error('Failed to get chat stats:', error);
      return {
        total_conversations: 0,
        total_messages: 0,
        average_messages_per_conversation: 0,
        escalation_rate: 0
      };
    }
  }
}
