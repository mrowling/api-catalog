/**
 * Conversation Manager
 * Manages active conversations and their state
 */

import { randomUUID } from 'crypto';
import { conversationStorage } from './conversation-storage.js';
import type { ConversationState, ConversationMessage, ConversationContext } from './conversation-storage.js';

export interface CreateConversationOptions {
  mode: 'create' | 'modify';
  description: string;
  existingSpec?: string;
}

export interface UpdateConversationOptions {
  currentSpec?: string;
  status?: 'active' | 'paused' | 'completed' | 'error';
  waitingFor?: 'question-answer' | 'diff-approval';
  pendingQuestion?: ConversationState['pendingQuestion'];
  pendingDiff?: ConversationState['pendingDiff'];
  addMessage?: ConversationMessage;
  context?: Partial<ConversationContext>;
}

/**
 * Manages conversation lifecycle and state
 */
export class ConversationManager {
  private activeConversations = new Map<string, ConversationState>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval (every hour)
    this.startCleanup();
  }

  /**
   * Create a new conversation
   */
  create(options: CreateConversationOptions): ConversationState {
    const id = randomUUID();
    const now = new Date();

    const conversation: ConversationState = {
      id,
      mode: options.mode,
      description: options.description,
      currentSpec: options.existingSpec,
      messages: [],
      status: 'active',
      context: {
        patternsApplied: [],
        qualityScores: [],
        userPreferences: {},
        previousRequests: [options.description],
        appliedChanges: [],
      },
      createdAt: now,
      updatedAt: now,
    };

    // Store in memory and persist
    this.activeConversations.set(id, conversation);
    conversationStorage.save(conversation);

    console.log(`✅ Created conversation ${id} (${options.mode})`);
    return conversation;
  }

  /**
   * Get conversation by ID
   */
  get(id: string): ConversationState | null {
    // Check memory first
    let conversation = this.activeConversations.get(id);
    
    if (!conversation) {
      // Try loading from storage
      const loaded = conversationStorage.load(id);
      if (loaded) {
        conversation = loaded;
        this.activeConversations.set(id, conversation);
      }
    }

    return conversation || null;
  }

  /**
   * Update conversation state
   */
  update(id: string, updates: UpdateConversationOptions): ConversationState | null {
    const conversation = this.get(id);
    if (!conversation) {
      return null;
    }

    // Apply updates
    if (updates.currentSpec !== undefined) {
      conversation.currentSpec = updates.currentSpec;
    }

    if (updates.status) {
      conversation.status = updates.status;
    }

    if (updates.waitingFor !== undefined) {
      conversation.waitingFor = updates.waitingFor;
    }

    if (updates.pendingQuestion !== undefined) {
      conversation.pendingQuestion = updates.pendingQuestion;
    }

    if (updates.pendingDiff !== undefined) {
      conversation.pendingDiff = updates.pendingDiff;
    }

    if (updates.addMessage) {
      conversation.messages.push(updates.addMessage);
    }

    if (updates.context) {
      conversation.context = {
        ...conversation.context,
        ...updates.context,
      };
    }

    conversation.updatedAt = new Date();

    // Persist changes
    this.activeConversations.set(id, conversation);
    conversationStorage.save(conversation);

    return conversation;
  }

  /**
   * Pause conversation (waiting for user input)
   */
  pause(id: string, waitingFor: 'question-answer' | 'diff-approval'): ConversationState | null {
    return this.update(id, {
      status: 'paused',
      waitingFor,
    });
  }

  /**
   * Resume conversation (after user input)
   */
  resume(id: string): ConversationState | null {
    const conversation = this.get(id);
    if (!conversation) {
      return null;
    }

    return this.update(id, {
      status: 'active',
      waitingFor: undefined,
      pendingQuestion: undefined,
      pendingDiff: undefined,
    });
  }

  /**
   * Complete conversation
   */
  complete(id: string, finalSpec?: string): ConversationState | null {
    return this.update(id, {
      status: 'completed',
      currentSpec: finalSpec,
      waitingFor: undefined,
    });
  }

  /**
   * Mark conversation as errored
   */
  error(id: string, errorMessage: string): ConversationState | null {
    const conversation = this.update(id, {
      status: 'error',
    });

    if (conversation) {
      this.update(id, {
        addMessage: {
          role: 'system',
          content: `Error: ${errorMessage}`,
          timestamp: new Date(),
        },
      });
    }

    return conversation;
  }

  /**
   * Delete conversation
   */
  delete(id: string): void {
    this.activeConversations.delete(id);
    conversationStorage.delete(id);
    console.log(`🗑️  Deleted conversation ${id}`);
  }

  /**
   * List all conversations
   */
  list(): Array<ConversationState> {
    const metadata = conversationStorage.list();
    const conversations: ConversationState[] = [];
    
    for (const meta of metadata) {
      const conv = this.get(meta.id);
      if (conv) {
        conversations.push(conv);
      }
    }
    
    return conversations;
  }

  /**
   * Add a message to conversation
   */
  addMessage(id: string, message: Omit<ConversationMessage, 'timestamp'>): ConversationState | null {
    return this.update(id, {
      addMessage: {
        ...message,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Update conversation context
   */
  updateContext(id: string, context: Partial<ConversationContext>): ConversationState | null {
    return this.update(id, { context });
  }

  /**
   * Get active conversations count
   */
  getActiveCount(): number {
    return Array.from(this.activeConversations.values())
      .filter(c => c.status === 'active' || c.status === 'paused')
      .length;
  }

  /**
   * Cleanup old conversations
   */
  cleanup(): number {
    const deleted = conversationStorage.deleteExpired();
    
    // Remove from active memory
    for (const [id, conversation] of this.activeConversations.entries()) {
      const age = Date.now() - conversation.updatedAt.getTime();
      if (age > 24 * 60 * 60 * 1000) { // 24 hours
        this.activeConversations.delete(id);
      }
    }

    if (deleted > 0) {
      console.log(`🧹 Cleaned up ${deleted} expired conversations`);
    }

    return deleted;
  }

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);

    // Run initial cleanup
    this.cleanup();
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();
