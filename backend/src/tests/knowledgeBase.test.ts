import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import type { KnowledgeBaseEntry } from '../types/index.js';

// Mock the MindsDB connection
jest.mock('../config/database.js', () => ({
  executeQuery: jest.fn()
}));

import { executeQuery } from '../config/database.js';
import { KnowledgeBaseService } from '../services/knowledgeBase.js';

const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;

describe('KnowledgeBaseService', () => {
  let service: KnowledgeBaseService;

  beforeEach(() => {
    service = new KnowledgeBaseService();
    jest.clearAllMocks();
  });

  describe('searchKnowledgeBase', () => {
    test('should return relevant knowledge base entries for a query', async () => {
      // Arrange
      const query = 'How do I reset my password?';
      const expectedResults: KnowledgeBaseEntry[] = [
        {
          id: 'kb_1',
          title: 'Password Reset Guide',
          content: 'To reset your password, go to the login page and click "Forgot Password"...',
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

      mockExecuteQuery.mockResolvedValue({
        rows: [
          {
            id: 'kb_1',
            chunk_content: 'To reset your password, go to the login page...',
            metadata: JSON.stringify({
              title: 'Password Reset Guide',
              category: 'technical',
              priority: 'medium',
              product_type: 'web_app',
              tags: ['password', 'reset', 'login']
            }),
            relevance: 0.95,
            distance: 0.05
          }
        ]
      });

      // Act
      const results = await service.searchKnowledgeBase(query, { limit: 5, relevance_threshold: 0.7 });

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('kb_1');
      expect(results[0].category).toBe('technical');
      expect(results[0].relevance).toBe(0.95);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, chunk_content, metadata')
      );
    });

    test('should return empty array when no results found', async () => {
      // Arrange
      const query = 'non-existent topic';
      
      mockExecuteQuery.mockResolvedValue({ rows: [] });

      // Act
      const results = await service.searchKnowledgeBase(query);

      // Assert
      expect(results).toHaveLength(0);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, chunk_content, metadata')
      );
    });

    test('should apply filters correctly', async () => {
      // Arrange
      const query = 'billing issue';
      
      mockExecuteQuery.mockResolvedValue({ rows: [] });

      // Act
      await service.searchKnowledgeBase(query, { 
        category: 'billing', 
        priority: 'high',
        limit: 10,
        relevance_threshold: 0.8
      });

      // Assert
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('billing')
      );
    });

    test('should handle database errors gracefully', async () => {
      // Arrange
      const query = 'test query';
      
      mockExecuteQuery.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.searchKnowledgeBase(query)).rejects.toThrow('Failed to search knowledge base');
    });
  });

  describe('addKnowledgeBaseEntry', () => {
    test('should successfully add new knowledge base entry', async () => {
      // Arrange
      const newEntry = {
        title: 'New FAQ Entry',
        content: 'This is a new FAQ entry for testing purposes.',
        category: 'general' as const,
        priority: 'medium' as const,
        product_type: 'web_app' as const,
        tags: ['faq', 'test']
      };

      mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await service.addKnowledgeBaseEntry(newEntry);

      // Assert
      expect(result).toBe(true);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO support_knowledge_base')
      );
    });

    test('should handle insert errors', async () => {
      // Arrange
      const newEntry = {
        title: 'New FAQ Entry',
        content: 'This is a new FAQ entry for testing purposes.',
        category: 'general' as const,
        priority: 'medium' as const,
        product_type: 'web_app' as const,
        tags: ['faq', 'test']
      };

      mockExecuteQuery.mockRejectedValue(new Error('Insert failed'));

      // Act & Assert
      await expect(service.addKnowledgeBaseEntry(newEntry)).rejects.toThrow('Failed to add knowledge base entry');
    });
  });

  describe('updateKnowledgeBaseEntry', () => {
    test('should successfully update knowledge base entry', async () => {
      // Arrange
      const entryId = 'kb_1';
      const updates = {
        title: 'Updated FAQ Entry',
        content: 'Updated content for testing.',
        category: 'technical' as const
      };

      mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await service.updateKnowledgeBaseEntry(entryId, updates);

      // Assert
      expect(result).toBe(true);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE support_knowledge_base')
      );
    });
  });

  describe('deleteKnowledgeBaseEntry', () => {
    test('should successfully delete knowledge base entry', async () => {
      // Arrange
      const entryId = 'kb_1';

      mockExecuteQuery.mockResolvedValue({ affectedRows: 1 });

      // Act
      const result = await service.deleteKnowledgeBaseEntry(entryId);

      // Assert
      expect(result).toBe(true);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM support_knowledge_base')
      );
    });

    test('should return false when entry not found', async () => {
      // Arrange
      const entryId = 'non_existent';

      mockExecuteQuery.mockResolvedValue({ affectedRows: 0 });

      // Act
      const result = await service.deleteKnowledgeBaseEntry(entryId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getCategories', () => {
    test('should return available categories', async () => {
      // Arrange
      const expectedCategories = ['technical', 'billing', 'general', 'shipping'];

      mockExecuteQuery.mockResolvedValue({
        rows: expectedCategories.map(cat => ({ category: cat }))
      });

      // Act
      const categories = await service.getCategories();

      // Assert
      expect(categories).toEqual(expectedCategories);
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT DISTINCT category')
      );
    });
  });

  describe('getStats', () => {
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

      // Mock multiple queries for stats - they execute in parallel with Promise.all
      mockExecuteQuery
        .mockResolvedValueOnce({ rows: [{ total: 100 }] })
        .mockResolvedValueOnce({ 
          rows: [
            { category: 'technical', count: 40 },
            { category: 'billing', count: 30 },
            { category: 'general', count: 20 },
            { category: 'shipping', count: 10 }
          ]
        })
        .mockResolvedValueOnce({
          rows: [
            { priority: 'high', count: 25 },
            { priority: 'medium', count: 50 },
            { priority: 'low', count: 25 }
          ]
        });

      // Act
      const stats = await service.getStats();

      // Assert
      expect(stats).toEqual(expectedStats);
      expect(mockExecuteQuery).toHaveBeenCalledTimes(3);
    });
  });
});
