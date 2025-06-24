import { Router } from 'express';
import { z } from 'zod';
import { ChatService } from '../services/chat.js';
import type { ChatRequest } from '../types/index.js';

export function createChatRouter(chatService?: ChatService): Router {
  const router = Router();
  const service = chatService || new ChatService();

// Validation schemas
const chatMessageSchema = z.object({
  message: z.string({ required_error: 'message is required' }).min(1, 'Message is required'),
  conversation_id: z.string().optional(),
  user_id: z.string().optional(),
  context: z.object({
    previous_messages: z.array(z.any()).optional(),
    user_preferences: z.record(z.any()).optional()
  }).optional()
});

/**
 * POST /api/chat/message
 * Process a chat message and return AI response
 */
  router.post('/message', async (req, res) => {
    try {
      const validatedRequest = chatMessageSchema.parse(req.body);
      
      const chatRequest: ChatRequest = {
        message: validatedRequest.message,
        conversation_id: validatedRequest.conversation_id,
        user_id: validatedRequest.user_id,
        context: validatedRequest.context
      };
      
      const response = await service.processMessage(chatRequest);
      
      res.json({
        success: true,
        data: response
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
      
      console.error('Chat message processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/chat/conversations/:conversationId/history
   * Get conversation history for a specific conversation
   */
  router.get('/conversations/:conversationId/history', async (req, res) => {
    try {
      const conversationId = req.params.conversationId;
      
      if (!conversationId) {
        return res.status(400).json({ 
          success: false,
          error: 'Conversation ID is required' 
        });
      }
      
      const messages = await service.getConversationHistory(conversationId);
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve conversation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/chat/users/:userId/conversations
   * Get all conversations for a specific user
   */
  router.get('/users/:userId/conversations', async (req, res) => {
    try {
      const userId = req.params.userId;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User ID is required' 
        });
      }
      
      const conversations = await service.getUserConversations(userId);
      
      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Get user conversations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user conversations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

/**
 * DELETE /api/chat/conversation/:id
 * Clear/delete a conversation
 */
router.delete('/conversation/:id', async (req, res) => {
  try {
    const conversationId = req.params.id;
    
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }
    
    const success = await service.clearConversation(conversationId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Conversation cleared successfully'
      });
    } else {
      res.status(404).json({
        error: 'Conversation not found'
      });
    }
  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({
      error: 'Failed to clear conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

  /**
   * GET /api/chat/stats
   * Get chat service statistics
   */
  router.get('/stats', async (req, res) => {
    try {
      const stats = await service.getStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get chat stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve chat statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

/**
 * GET /api/chat/health
 * Health check endpoint
 */
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'chat',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
