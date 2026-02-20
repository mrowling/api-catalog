/**
 * Conversation routes
 * HTTP endpoints for managing interactive conversations
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { conversationManager } from '../services/conversation-manager';

const conversationRoutes = new Hono();

// Answer question schema
const answerQuestionSchema = z.object({
  conversationId: z.string(),
  questionId: z.string(),
  answer: z.union([z.string(), z.array(z.string())]) // Single or multiple answers
});

// Diff action schema
const diffActionSchema = z.object({
  conversationId: z.string(),
  action: z.enum(['approve', 'cancel', 'refine']),
  refinementPrompt: z.string().optional() // Required if action is 'refine'
});

/**
 * POST /api/conversation/answer
 * Submit answer to a pending question
 */
conversationRoutes.post('/answer', zValidator('json', answerQuestionSchema), async (c) => {
  try {
    const { conversationId, questionId, answer } = c.req.valid('json');
    
    console.log(`💬 Answering question ${questionId} in conversation ${conversationId}`);
    
    // Get conversation
    const conversation = conversationManager.get(conversationId);
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Verify conversation is waiting for answer
    if (conversation.status !== 'paused' || conversation.waitingFor !== 'question-answer') {
      return c.json({ 
        error: 'Conversation is not waiting for an answer',
        status: conversation.status,
        waitingFor: conversation.waitingFor
      }, 400);
    }

    // Verify question ID matches
    if (!conversation.pendingQuestion || conversation.pendingQuestion.id !== questionId) {
      return c.json({ 
        error: 'Question ID does not match pending question',
        expected: conversation.pendingQuestion?.id,
        received: questionId
      }, 400);
    }

    // Add user's answer to messages
    conversationManager.update(conversationId, {
      addMessage: {
        role: 'user',
        content: JSON.stringify({ questionId, answer }),
        timestamp: new Date()
      }
    });

    // Resume conversation (clear pending question)
    conversationManager.resume(conversationId);

    // TODO: Trigger continuation of generation stream with the answer
    // For now, we'll just mark as resumed - the frontend will need to 
    // handle re-establishing the SSE connection with the answer in context

    return c.json({
      success: true,
      message: 'Answer recorded, conversation resumed',
      conversationId
    });
  } catch (error) {
    console.error('❌ Answer error:', error);
    return c.json({
      error: 'Failed to process answer',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/conversation/diff-action
 * Handle diff approval/rejection/refinement
 */
conversationRoutes.post('/diff-action', zValidator('json', diffActionSchema), async (c) => {
  try {
    const { conversationId, action, refinementPrompt } = c.req.valid('json');
    
    console.log(`🔀 Diff action "${action}" in conversation ${conversationId}`);
    
    // Get conversation
    const conversation = conversationManager.get(conversationId);
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Verify conversation is waiting for diff action
    if (conversation.status !== 'paused' || conversation.waitingFor !== 'diff-approval') {
      return c.json({ 
        error: 'Conversation is not waiting for diff approval',
        status: conversation.status,
        waitingFor: conversation.waitingFor
      }, 400);
    }

    // Verify diff exists
    if (!conversation.pendingDiff) {
      return c.json({ error: 'No pending diff found' }, 400);
    }

    // Validate refinement prompt if action is refine
    if (action === 'refine' && !refinementPrompt) {
      return c.json({ error: 'Refinement prompt required for refine action' }, 400);
    }

    // Add user's action to messages
    const messageContent: any = { action };
    if (action === 'refine') {
      messageContent.refinementPrompt = refinementPrompt;
    }

    conversationManager.update(conversationId, {
      addMessage: {
        role: 'user',
        content: JSON.stringify(messageContent),
        timestamp: new Date()
      }
    });

    // Handle action
    if (action === 'approve') {
      // Apply the diff (update currentSpec)
      conversationManager.update(conversationId, {
        currentSpec: conversation.pendingDiff.after,
        context: {
          appliedChanges: [
            ...conversation.context.appliedChanges,
            conversation.pendingDiff.summary
          ]
        }
      });
    }

    // Resume conversation
    conversationManager.resume(conversationId);

    // TODO: Trigger continuation of generation stream with the action
    // Similar to answer endpoint, this needs integration with the streaming generator

    return c.json({
      success: true,
      message: `Diff ${action}ed, conversation resumed`,
      conversationId,
      appliedSpec: action === 'approve' ? conversation.pendingDiff.after : undefined
    });
  } catch (error) {
    console.error('❌ Diff action error:', error);
    return c.json({
      error: 'Failed to process diff action',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/conversation/:id
 * Get conversation state
 */
conversationRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const conversation = conversationManager.get(id);
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    return c.json(conversation);
  } catch (error) {
    console.error('❌ Get conversation error:', error);
    return c.json({
      error: 'Failed to get conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * DELETE /api/conversation/:id
 * Cancel/delete conversation
 */
conversationRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Verify conversation exists
    const conversation = conversationManager.get(id);
    if (!conversation) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // Delete it
    conversationManager.delete(id);

    return c.json({
      success: true,
      message: 'Conversation deleted',
      conversationId: id
    });
  } catch (error) {
    console.error('❌ Delete conversation error:', error);
    return c.json({
      error: 'Failed to delete conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/conversation
 * List all conversations
 */
conversationRoutes.get('/', async (c) => {
  try {
    const conversations = conversationManager.list();
    
    return c.json({
      conversations,
      count: conversations.length
    });
  } catch (error) {
    console.error('❌ List conversations error:', error);
    return c.json({
      error: 'Failed to list conversations',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { conversationRoutes };
