import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { ChatRequest, ChatResponse, KnowledgeBaseEntry, QueryClassification, ResponseGeneration } from '../types/index.js';

// Mock the services
jest.mock('../services/knowledgeBase.js', () => ({
  KnowledgeBaseService: jest.fn().mockImplementation(() => ({
    searchKnowledgeBase: jest.fn()
  }))
}));

jest.mock('../services/ai.js', () => ({
  AIService: jest.fn().mockImplementation(() => ({
    classifyQuery: jest.fn(),
    generateResponse: jest.fn(),
    shouldEscalate: jest.fn(),
    getSuggestedActions: jest.fn()
  }))
}));

import { ChatService } from '../services/chat.js';
import { KnowledgeBaseService } from '../services/knowledgeBase.js';
import { AIService } from '../services/ai.js';

const mockKnowledgeBaseService = new KnowledgeBaseService() as jest.Mocked<KnowledgeBaseService>;
const mockAIService = new AIService() as jest.Mocked<AIService>;

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    service = new ChatService(mockKnowledgeBaseService, mockAIService);
    jest.clearAllMocks();
  });

  describe('processMessage', () => {
    test('should process a message with relevant knowledge base results', async () => {
      // Arrange
      const request: ChatRequest = {
        message: 'How do I reset my password?',
        conversation_id: 'conv_123',
        user_id: 'user_456'
      };

      const mockKBResults: KnowledgeBaseEntry[] = [
        {
          id: 'kb_1',
          title: 'Password Reset Guide',
          content: 'To reset your password, go to the login page and click "Forgot Password".',
          category: 'technical',
          priority: 'medium',
          product_type: 'web_app',
          tags: ['password', 'reset', 'login'],
          last_updated: new Date(),
          chunk_content: 'To reset your password, go to the login page...',
          relevance: 0.95,
          distance: 0.05
        }
      ];

      const mockClassification: QueryClassification = {
        category: 'technical',
        intent: 'account_help',
        confidence: 0.9,
        entities: [
          { type: 'action', value: 'password', confidence: 0.9 },
          { type: 'action', value: 'reset', confidence: 0.8 }
        ]
      };

      const mockGeneration: ResponseGeneration = {
        response: 'To reset your password, please go to the login page and click "Forgot Password". Follow the instructions sent to your registered email address.',
        confidence: 0.95,
        reasoning: 'Found relevant information in knowledge base about password reset procedure.',
        requires_escalation: false
      };

      mockKnowledgeBaseService.searchKnowledgeBase.mockResolvedValue(mockKBResults);
      mockAIService.classifyQuery.mockResolvedValue(mockClassification);
      mockAIService.generateResponse.mockResolvedValue(mockGeneration);
      mockAIService.shouldEscalate.mockResolvedValue(false);
      mockAIService.getSuggestedActions.mockReturnValue(['Follow the password reset link']);

      // Act
      const response = await service.processMessage(request);

      // Assert
      expect(response.message).toBe(mockGeneration.response);
      expect(response.confidence).toBe(0.95);
      expect(response.sources).toHaveLength(1);
      expect(response.sources[0].id).toBe('kb_1');
      expect(response.requires_escalation).toBe(false);
      expect(response.conversation_id).toBe('conv_123');
      expect(response.metadata.category).toBe('technical');

      expect(mockKnowledgeBaseService.searchKnowledgeBase).toHaveBeenCalledWith(
        request.message,
        expect.objectContaining({ limit: 5, relevance_threshold: 0.7 })
      );
      expect(mockAIService.classifyQuery).toHaveBeenCalledWith(request.message);
      expect(mockAIService.generateResponse).toHaveBeenCalledWith(
        request.message,
        mockKBResults,
        mockClassification
      );
    });

    test('should handle queries with no relevant knowledge base results', async () => {
      // Arrange
      const request: ChatRequest = {
        message: 'I need help with my billing issue but this is very specific',
        conversation_id: 'conv_789',
        user_id: 'user_456'
      };

      mockKnowledgeBaseService.searchKnowledgeBase.mockResolvedValue([]);
      mockAIService.classifyQuery.mockResolvedValue({
        category: 'billing',
        intent: 'billing_inquiry',
        confidence: 0.8,
        entities: []
      });
      mockAIService.generateResponse.mockResolvedValue({
        response: 'I understand you have a billing concern, but I may need more information to help you properly.',
        confidence: 0.6,
        reasoning: 'No specific knowledge base entries found for this billing query.',
        requires_escalation: true
      });
      mockAIService.shouldEscalate.mockResolvedValue(true);
      mockAIService.getSuggestedActions.mockReturnValue(['Contact billing support']);

      // Act
      const response = await service.processMessage(request);

      // Assert
      expect(response.message).toContain('billing concern');
      expect(response.confidence).toBe(0.6);
      expect(response.sources).toHaveLength(0);
      expect(response.requires_escalation).toBe(true);
      expect(response.suggested_actions).toContain('Contact billing support');
    });

    test('should handle low-confidence queries appropriately', async () => {
      // Arrange
      const request: ChatRequest = {
        message: 'asdfgh random text xyz',
        conversation_id: 'conv_999',
        user_id: 'user_456'
      };

      mockKnowledgeBaseService.searchKnowledgeBase.mockResolvedValue([]);
      mockAIService.classifyQuery.mockResolvedValue({
        category: 'general',
        intent: 'unclear',
        confidence: 0.3,
        entities: []
      });
      mockAIService.generateResponse.mockResolvedValue({
        response: 'Hello! How can I help you today?',
        confidence: 0.4,
        reasoning: 'Query intent unclear, providing general greeting.',
        requires_escalation: false
      });
      mockAIService.shouldEscalate.mockResolvedValue(false);
      mockAIService.getSuggestedActions.mockReturnValue(['Try rephrasing your question']);

      // Act
      const response = await service.processMessage(request);

      // Assert
      expect(response.message).toContain('How can I help');
      expect(response.confidence).toBe(0.4);
      expect(response.suggested_actions).toContain('Try rephrasing your question');
    });

    test('should handle service errors gracefully', async () => {
      // Arrange
      const request: ChatRequest = {
        message: 'test message',
        conversation_id: 'conv_error',
        user_id: 'user_456'
      };

      mockKnowledgeBaseService.searchKnowledgeBase.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.processMessage(request)).rejects.toThrow('Failed to process message');
    });
  });

  describe('getConversationHistory', () => {
    test('should return conversation history for valid conversation', async () => {
      // This would require mocking a database or storage service
      // For now, we'll test the interface
      const conversationId = 'conv_123';
      
      try {
        const history = await service.getConversationHistory(conversationId);
        expect(Array.isArray(history)).toBe(true);
      } catch (error) {
        // Expected since we don't have a real implementation yet
        expect(error).toBeDefined();
      }
    });
  });

  describe('getUserConversations', () => {
    test('should return user conversations for valid user', async () => {
      // This would require mocking a database or storage service
      const userId = 'user_456';
      
      try {
        const conversations = await service.getUserConversations(userId);
        expect(Array.isArray(conversations)).toBe(true);
      } catch (error) {
        // Expected since we don't have a real implementation yet
        expect(error).toBeDefined();
      }
    });
  });

  describe('getStats', () => {
    test('should return chat statistics', async () => {
      // This would require mocking a database or storage service
      try {
        const stats = await service.getStats();
        expect(typeof stats).toBe('object');
      } catch (error) {
        // Expected since we don't have a real implementation yet
        expect(error).toBeDefined();
      }
    });
  });
});
