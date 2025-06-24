import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock the services
jest.mock('../services/chat.js', () => ({
  ChatService: jest.fn().mockImplementation(() => ({
    processMessage: jest.fn(),
    getConversationHistory: jest.fn(),
    getUserConversations: jest.fn(),
    getStats: jest.fn()
  }))
}));

jest.mock('../services/knowledgeBase.js', () => ({
  KnowledgeBaseService: jest.fn().mockImplementation(() => ({
    searchKnowledgeBase: jest.fn(),
    addKnowledgeBaseEntry: jest.fn(),
    getCategories: jest.fn(),
    getStats: jest.fn()
  }))
}));

import { ChatService } from '../services/chat.js';
import { KnowledgeBaseService } from '../services/knowledgeBase.js';
import { createChatRouter } from '../routes/chat.js';
import { createKnowledgeBaseRouter } from '../routes/knowledgeBase.js';
import { createAgentsRouter } from '../routes/agents.js';
import { AgentsService } from '../services/agents.js';

const mockChatService = new ChatService() as jest.Mocked<ChatService>;
const mockKnowledgeBaseService = new KnowledgeBaseService() as jest.Mocked<KnowledgeBaseService>;

describe('API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/chat', createChatRouter(mockChatService));
    app.use('/api/kb', createKnowledgeBaseRouter(mockKnowledgeBaseService));
    jest.clearAllMocks();
  });

  describe('Chat Routes', () => {
    describe('POST /api/chat/message', () => {
      test('should process message successfully', async () => {
        // Arrange
        const requestBody = {
          message: 'How do I reset my password?',
          conversation_id: 'conv_123',
          user_id: 'user_456'
        };

        const expectedResponse = {
          message: 'To reset your password, please go to the login page...',
          confidence: 0.95,
          sources: [],
          suggested_actions: ['Follow the password reset link'],
          requires_escalation: false,
          conversation_id: 'conv_123',
          metadata: {
            processing_time: 150,
            category: 'technical',
            priority: 'medium' as const
          }
        };

        mockChatService.processMessage.mockResolvedValue(expectedResponse);

        // Act
        const response = await request(app)
          .post('/api/chat/message')
          .send(requestBody);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(expectedResponse);
        expect(mockChatService.processMessage).toHaveBeenCalledWith(requestBody);
      });

      test('should handle invalid request body', async () => {
        // Act
        const response = await request(app)
          .post('/api/chat/message')
          .send({});

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('message is required');
      });

      test('should handle service errors', async () => {
        // Arrange
        const requestBody = {
          message: 'test message',
          conversation_id: 'conv_123',
          user_id: 'user_456'
        };

        mockChatService.processMessage.mockRejectedValue(new Error('Service unavailable'));

        // Act
        const response = await request(app)
          .post('/api/chat/message')
          .send(requestBody);

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Internal server error');
      });
    });

    describe('GET /api/chat/conversations/:conversationId/history', () => {
      test('should return conversation history', async () => {
        // Arrange
        const conversationId = 'conv_123';
        const timestamp = new Date();
        const expectedHistory = [
          {
            id: 'msg_1',
            content: 'Hello, how can I help?',
            role: 'assistant' as const,
            timestamp: timestamp
          },
          {
            id: 'msg_2',
            content: 'I need help with my account',
            role: 'user' as const,
            timestamp: timestamp
          }
        ];

        mockChatService.getConversationHistory.mockResolvedValue(expectedHistory);

        // Act
        const response = await request(app)
          .get(`/api/chat/conversations/${conversationId}/history`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Since JSON serialization converts Date to string, we need to check the serialized version
        expect(response.body.data).toEqual([
          {
            id: 'msg_1',
            content: 'Hello, how can I help?',
            role: 'assistant',
            timestamp: timestamp.toISOString()
          },
          {
            id: 'msg_2',
            content: 'I need help with my account',
            role: 'user',
            timestamp: timestamp.toISOString()
          }
        ]);
      });
    });

    describe('GET /api/chat/users/:userId/conversations', () => {
      test('should return user conversations', async () => {
        // Arrange
        const userId = 'user_456';
        const expectedConversations = ['conv_123', 'conv_456', 'conv_789'];

        mockChatService.getUserConversations.mockResolvedValue(expectedConversations);

        // Act
        const response = await request(app)
          .get(`/api/chat/users/${userId}/conversations`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(expectedConversations);
      });
    });

    describe('GET /api/chat/stats', () => {
      test('should return chat statistics', async () => {
        // Arrange
        const expectedStats = {
          total_conversations: 150,
          total_messages: 750,
          average_messages_per_conversation: 5,
          escalation_rate: 0.15
        };

        mockChatService.getStats.mockResolvedValue(expectedStats);

        // Act
        const response = await request(app)
          .get('/api/chat/stats');

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(expectedStats);
      });
    });
  });

  describe('Knowledge Base Routes', () => {
    describe('GET /api/kb/search', () => {
      test('should search knowledge base successfully', async () => {
        // Arrange
        const query = 'password reset';
        const timestamp = new Date();
        const expectedResults = [
          {
            id: 'kb_1',
            title: 'Password Reset Guide',
            content: 'Step-by-step guide to reset your password...',
            category: 'technical' as const,
            priority: 'medium' as const,
            product_type: 'web_app',
            tags: ['password', 'reset'],
            last_updated: timestamp,
            chunk_content: 'Step-by-step guide to reset your password...',
            relevance: 0.95,
            distance: 0.05
          }
        ];

        mockKnowledgeBaseService.searchKnowledgeBase.mockResolvedValue(expectedResults);

        // Act
        const response = await request(app)
          .get('/api/kb/search')
          .query({ q: query });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Since JSON serialization converts Date to string, we need to check the serialized version
        expect(response.body.data.results).toEqual([
          {
            id: 'kb_1',
            title: 'Password Reset Guide',
            content: 'Step-by-step guide to reset your password...',
            category: 'technical',
            priority: 'medium',
            product_type: 'web_app',
            tags: ['password', 'reset'],
            last_updated: timestamp.toISOString(),
            chunk_content: 'Step-by-step guide to reset your password...',
            relevance: 0.95,
            distance: 0.05
          }
        ]);
        expect(response.body.data.total).toBe(1);
        expect(mockKnowledgeBaseService.searchKnowledgeBase).toHaveBeenCalledWith(
          query,
          expect.objectContaining({ limit: 10 })
        );
      });

      test('should handle missing query parameter', async () => {
        // Act
        const response = await request(app)
          .get('/api/kb/search');

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Query parameter is required');
      });
    });

    describe('POST /api/kb/entries', () => {
      test('should add knowledge base entry successfully', async () => {
        // Arrange
        const newEntry = {
          title: 'New FAQ Entry',
          content: 'This is a new FAQ entry.',
          category: 'general' as const,
          priority: 'medium' as const,
          product_type: 'web_app' as const,
          tags: ['faq', 'general']
        };

        mockKnowledgeBaseService.addKnowledgeBaseEntry.mockResolvedValue(true);

        // Act
        const response = await request(app)
          .post('/api/kb/entries')
          .send(newEntry);

        // Assert
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('successfully added');
        expect(mockKnowledgeBaseService.addKnowledgeBaseEntry).toHaveBeenCalledWith(newEntry);
      });

      test('should handle invalid entry data', async () => {
        // Act
        const response = await request(app)
          .post('/api/kb/entries')
          .send({});

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('required');
      });
    });

    describe('GET /api/kb/categories', () => {
      test('should return available categories', async () => {
        // Arrange
        const expectedCategories = ['technical', 'billing', 'general', 'shipping'];

        mockKnowledgeBaseService.getCategories.mockResolvedValue(expectedCategories);

        // Act
        const response = await request(app)
          .get('/api/kb/categories');

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(expectedCategories);
      });
    });

    describe('GET /api/kb/stats', () => {
      test('should return knowledge base statistics', async () => {
        // Arrange
        const expectedStats = {
          total_entries: 100,
          by_category: {
            technical: 40,
            billing: 30,
            general: 20,
            shipping: 10
          },
          by_priority: {
            high: 25,
            medium: 50,
            low: 25
          }
        };

        mockKnowledgeBaseService.getStats.mockResolvedValue(expectedStats);

        // Act
        const response = await request(app)
          .get('/api/kb/stats');

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(expectedStats);
      });
    });
  });

  describe('Agents Routes', () => {
    let app: Express;
    
    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use('/api/agents', createAgentsRouter());
    });

    describe('POST /api/agents', () => {
      it('should create a new agent successfully', async () => {
        const agentConfig = {
          name: 'test_api_agent',
          model: 'gpt-3.5-turbo',
          provider: 'openai',
          api_key: 'test-api-key',
          knowledge_bases: ['support_kb'],
          prompt_template: 'You are a helpful assistant.'
        };

        const response = await request(app)
          .post('/api/agents')
          .send(agentConfig)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('test_api_agent');
        expect(response.body.data.model).toBe('gpt-3.5-turbo');
        expect(response.body.data.status).toBe('active');
        expect(response.body.message).toBe('Agent created successfully');
      });

      it('should return 400 for invalid agent configuration', async () => {
        const invalidConfig = {
          name: '', // Invalid: empty name
          model: 'gpt-3.5-turbo',
          provider: 'openai'
          // Missing required api_key
        };

        const response = await request(app)
          .post('/api/agents')
          .send(invalidConfig)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });

      it('should return 400 for invalid provider', async () => {
        const invalidConfig = {
          name: 'test_agent',
          model: 'gpt-3.5-turbo',
          provider: 'invalid_provider', // Invalid provider
          api_key: 'test-key'
        };

        const response = await request(app)
          .post('/api/agents')
          .send(invalidConfig)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('provider');
      });
    });

    describe('POST /api/agents/query', () => {
      it('should query an agent successfully', async () => {
        // First create an agent
        const agentConfig = {
          name: 'query_api_agent',
          model: 'gpt-3.5-turbo',
          provider: 'openai',
          api_key: 'test-api-key'
        };

        await request(app)
          .post('/api/agents')
          .send(agentConfig)
          .expect(201);

        // Then query it
        const queryRequest = {
          question: 'How do I reset my password?',
          agent_name: 'query_api_agent'
        };

        const response = await request(app)
          .post('/api/agents/query')
          .send(queryRequest)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.answer).toBeDefined();
        expect(response.body.data.agent_name).toBe('query_api_agent');
        expect(response.body.data.confidence).toBeGreaterThan(0);
      });

      it('should return 400 for missing question', async () => {
        const invalidQuery = {
          agent_name: 'test_agent'
          // Missing question
        };

        const response = await request(app)
          .post('/api/agents/query')
          .send(invalidQuery)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('question');
      });

      it('should return 500 for non-existent agent', async () => {
        const queryRequest = {
          question: 'Test question',
          agent_name: 'non_existent_agent'
        };

        const response = await request(app)
          .post('/api/agents/query')
          .send(queryRequest)
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not found');
      });
    });

    describe('GET /api/agents', () => {
      it('should list all agents', async () => {
        const response = await request(app)
          .get('/api/agents')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.total).toBeDefined();
        expect(response.body.total).toBeGreaterThanOrEqual(0);
      });
    });

    describe('GET /api/agents/:name', () => {
      it('should get a specific agent', async () => {
        // First create an agent
        const agentConfig = {
          name: 'get_api_agent',
          model: 'gpt-4',
          provider: 'openai',
          api_key: 'test-api-key',
          prompt_template: 'Test prompt'
        };

        await request(app)
          .post('/api/agents')
          .send(agentConfig)
          .expect(201);

        // Then get it
        const response = await request(app)
          .get('/api/agents/get_api_agent')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('get_api_agent');
        expect(response.body.data.model).toBe('gpt-4');
      });

      it('should return 404 for non-existent agent', async () => {
        const response = await request(app)
          .get('/api/agents/non_existent_agent')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not found');
      });
    });

    describe('GET /api/agents/:name/status', () => {
      it('should get agent status', async () => {
        // First create an agent
        const agentConfig = {
          name: 'status_api_agent',
          model: 'gpt-3.5-turbo',
          provider: 'openai',
          api_key: 'test-api-key'
        };

        await request(app)
          .post('/api/agents')
          .send(agentConfig)
          .expect(201);

        // Then get its status
        const response = await request(app)
          .get('/api/agents/status_api_agent/status')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('status_api_agent');
        expect(response.body.data.status).toBe('active');
        expect(response.body.data.model).toBe('gpt-3.5-turbo');
      });

      it('should return 404 for non-existent agent status', async () => {
        const response = await request(app)
          .get('/api/agents/non_existent_agent/status')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not found');
      });
    });

    describe('DELETE /api/agents/:name', () => {
      it('should delete an agent successfully', async () => {
        // First create an agent
        const agentConfig = {
          name: 'delete_api_agent',
          model: 'gpt-3.5-turbo',
          provider: 'openai',
          api_key: 'test-api-key'
        };

        await request(app)
          .post('/api/agents')
          .send(agentConfig)
          .expect(201);

        // Then delete it
        const response = await request(app)
          .delete('/api/agents/delete_api_agent')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');

        // Verify it's deleted
        await request(app)
          .get('/api/agents/delete_api_agent')
          .expect(404);
      });

      it('should return 404 for non-existent agent deletion', async () => {
        const response = await request(app)
          .delete('/api/agents/non_existent_agent')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not found');
      });
    });
  });
});
