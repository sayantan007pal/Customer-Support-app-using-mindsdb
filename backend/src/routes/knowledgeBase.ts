import { Router } from 'express';
import { z } from 'zod';
import { KnowledgeBaseService } from '../services/knowledgeBase.js';
import type { KnowledgeBaseEntry } from '../types/index.js';

export function createKnowledgeBaseRouter(knowledgeBaseService?: KnowledgeBaseService): Router {
  const router = Router();
  const service = knowledgeBaseService || new KnowledgeBaseService();

// Validation schemas
const searchQuerySchema = z.object({
  q: z.string({ required_error: 'Query parameter is required' }).min(1, 'Query parameter is required'),
  category: z.string().optional(),
  priority: z.string().optional(),
  product_type: z.string().optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
  relevance_threshold: z.string().transform(val => parseFloat(val)).optional()
});

const addEntrySchema = z.object({
  title: z.string({ required_error: 'Title is required' }).min(1, 'Title is required'),
  content: z.string({ required_error: 'Content is required' }).min(1, 'Content is required'),
  category: z.enum(['billing', 'technical', 'general', 'shipping', 'returns'], { required_error: 'Category is required' }),
  priority: z.enum(['low', 'medium', 'high'], { required_error: 'Priority is required' }),
  product_type: z.string().optional(),
  tags: z.array(z.string()).default([])
});

const updateEntrySchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  category: z.enum(['billing', 'technical', 'general', 'shipping', 'returns']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  product_type: z.string().optional(),
  tags: z.array(z.string()).optional()
});

  /**
   * GET /api/kb/search
   * Search the knowledge base using semantic search
   */
  router.get('/search', async (req, res) => {
    try {
      const validatedQuery = searchQuerySchema.parse(req.query);
      
      const results = await service.searchKnowledgeBase(
        validatedQuery.q,
        {
          category: validatedQuery.category,
          priority: validatedQuery.priority,
          product_type: validatedQuery.product_type,
          limit: validatedQuery.limit || 10,
          relevance_threshold: validatedQuery.relevance_threshold
        }
      );
      
      res.json({
        success: true,
        data: {
          results,
          total: results.length
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        const errorMessage = `${firstError.path.join('.')}: ${firstError.message}`;
        return res.status(400).json({
          success: false,
          error: errorMessage,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      
      console.error('Knowledge base search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search knowledge base',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/kb/entries
   * Add a new entry to the knowledge base
   */
  router.post('/entries', async (req, res) => {
    try {
      const validatedEntry = addEntrySchema.parse(req.body);
      
      const success = await service.addKnowledgeBaseEntry(validatedEntry);
      
      if (success) {
        res.status(201).json({
          success: true,
          message: 'Entry successfully added to knowledge base'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to add knowledge base entry'
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        const errorMessage = `${firstError.path.join('.')}: ${firstError.message}`;
        return res.status(400).json({
          success: false,
          error: errorMessage,
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      
      console.error('Add knowledge base entry error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add knowledge base entry',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

/**
 * PUT /api/kb/entries/:id
 * Update an existing knowledge base entry
 */
router.put('/entries/:id', async (req, res) => {
  try {
    const entryId = req.params.id;
    const validatedUpdates = updateEntrySchema.parse(req.body);
    
    if (!entryId) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }
    
    const success = await service.updateKnowledgeBaseEntry(entryId, validatedUpdates);
    
    if (success) {
      res.json({
        success: true,
        message: 'Knowledge base entry updated successfully'
      });
    } else {
      res.status(404).json({
        error: 'Knowledge base entry not found'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    
    console.error('Update knowledge base entry error:', error);
    res.status(500).json({
      error: 'Failed to update knowledge base entry',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/kb/entries/:id
 * Delete a knowledge base entry
 */
router.delete('/entries/:id', async (req, res) => {
  try {
    const entryId = req.params.id;
    
    if (!entryId) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }
    
    const success = await service.deleteKnowledgeBaseEntry(entryId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Knowledge base entry deleted successfully'
      });
    } else {
      res.status(404).json({
        error: 'Knowledge base entry not found'
      });
    }
  } catch (error) {
    console.error('Delete knowledge base entry error:', error);
    res.status(500).json({
      error: 'Failed to delete knowledge base entry',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

  /**
   * GET /api/kb/categories
   * Get all available categories in the knowledge base
   */
  router.get('/categories', async (req, res) => {
    try {
      const categories = await service.getCategories();
      
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve categories',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/kb/stats
   * Get knowledge base statistics
   */
  router.get('/stats', async (req, res) => {
    try {
      const stats = await service.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get knowledge base stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve knowledge base statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

/**
 * GET /api/kb/health
 * Health check endpoint
 */
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'knowledge-base',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
