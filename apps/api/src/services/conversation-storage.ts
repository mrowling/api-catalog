/**
 * Conversation Storage Service
 * Persists conversation state to SQLite cache
 */

import { getCache } from '@ai-openapi/shared';
import type { SQLiteCache } from '@ai-openapi/shared';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ConversationContext {
  templateUsed?: string;
  patternsApplied: string[];
  qualityScores: number[];
  userPreferences: {
    authType?: string;
    paginationType?: string;
    errorFormat?: string;
  };
  previousRequests: string[];
  appliedChanges: string[];
}

export interface ConversationState {
  id: string;
  mode: 'create' | 'modify';
  description: string;
  currentSpec?: string;
  messages: ConversationMessage[];
  status: 'active' | 'paused' | 'completed' | 'error';
  waitingFor?: 'question-answer' | 'diff-approval';
  pendingQuestion?: {
    id: string;
    question: string;
    options: Array<{ label: string; value: string }>;
    default?: string;
  };
  pendingDiff?: {
    before: string;
    after: string;
    summary: string;
  };
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMetadata {
  id: string;
  mode: 'create' | 'modify';
  description: string;
  status: string;
  messageCount: number;
  qualityScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ConversationStorage {
  private cache: SQLiteCache;
  private readonly KEY_PREFIX = 'conversation:';
  private readonly METADATA_PREFIX = 'conversation:meta:';
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.cache = getCache();
  }

  /**
   * Save conversation state
   */
  save(conversation: ConversationState): void {
    const key = `${this.KEY_PREFIX}${conversation.id}`;
    const metaKey = `${this.METADATA_PREFIX}${conversation.id}`;

    // Save full conversation state
    this.cache.set(key, JSON.stringify(conversation), this.TTL);

    // Save metadata for listing
    const metadata: ConversationMetadata = {
      id: conversation.id,
      mode: conversation.mode,
      description: conversation.description,
      status: conversation.status,
      messageCount: conversation.messages.length,
      qualityScore: conversation.context.qualityScores[conversation.context.qualityScores.length - 1],
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
    this.cache.set(metaKey, JSON.stringify(metadata), this.TTL);
  }

  /**
   * Load conversation state
   */
  load(id: string): ConversationState | null {
    const key = `${this.KEY_PREFIX}${id}`;
    const data = this.cache.get<string>(key);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    
    // Restore Date objects
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      messages: parsed.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    };
  }

  /**
   * Get conversation metadata
   */
  getMetadata(id: string): ConversationMetadata | null {
    const metaKey = `${this.METADATA_PREFIX}${id}`;
    const data = this.cache.get<string>(metaKey);

    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
    };
  }

  /**
   * List all conversation metadata (sorted by updatedAt desc)
   */
  list(): ConversationMetadata[] {
    const keys = this.cache.keys(`${this.METADATA_PREFIX}*`);
    const metadataList: ConversationMetadata[] = [];

    for (const key of keys) {
      const data = this.cache.get<string>(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          metadataList.push({
            ...parsed,
            createdAt: new Date(parsed.createdAt),
            updatedAt: new Date(parsed.updatedAt),
          });
        } catch (err) {
          console.error(`Failed to parse conversation metadata: ${key}`, err);
        }
      }
    }

    // Sort by updatedAt descending (most recent first)
    return metadataList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Delete conversation
   */
  delete(id: string): void {
    const key = `${this.KEY_PREFIX}${id}`;
    const metaKey = `${this.METADATA_PREFIX}${id}`;
    
    this.cache.delete(key);
    this.cache.delete(metaKey);
  }

  /**
   * Delete expired conversations (24h+)
   */
  deleteExpired(): number {
    // SQLite cache already handles expiration via TTL
    // This method is here for explicit cleanup if needed
    const allMetadata = this.list();
    const now = Date.now();
    let deleted = 0;

    for (const meta of allMetadata) {
      const age = now - meta.updatedAt.getTime();
      if (age > this.TTL) {
        this.delete(meta.id);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Clear all conversations (for testing)
   */
  clear(): void {
    this.cache.deletePattern(`${this.KEY_PREFIX}*`);
    this.cache.deletePattern(`${this.METADATA_PREFIX}*`);
  }
}

// Export singleton instance
export const conversationStorage = new ConversationStorage();
