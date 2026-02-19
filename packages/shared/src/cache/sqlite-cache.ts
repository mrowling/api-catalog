/**
 * SQLite-based cache service for GitHub API responses
 * Shared between API server and CLI for consistent caching
 * Uses Node.js native SQLite (node:sqlite) - requires Node.js 22.5+
 */

import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

export interface CacheEntry {
  key: string;
  value: string;
  expiresAt: number;
  createdAt: number;
}

export interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  totalSize: number;
}

/**
 * SQLite cache service with automatic cleanup and shared access
 */
export class SQLiteCache {
  private db: DatabaseSync | null = null;
  private dbPath: string;
  private defaultTTL: number;
  private initialized: boolean = false;

  constructor(options?: {
    dbPath?: string;
    defaultTTL?: number; // in milliseconds
  }) {
    // Default cache location: ~/.ai-openapi-cache/cache.db
    const defaultPath = join(homedir(), '.ai-openapi-cache', 'cache.db');
    this.dbPath = options?.dbPath || defaultPath;
    this.defaultTTL = options?.defaultTTL || 5 * 60 * 1000; // 5 minutes default
    
    // Ensure directory exists
    const dir = dirname(this.dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Initialize the database
   */
  private ensureInitialized(): void {
    if (this.initialized && this.db) {
      return;
    }

    // Create database connection
    this.db = new DatabaseSync(this.dbPath);

    // Create tables if they don't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
    
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_expires_at ON cache(expires_at)
    `);

    this.initialized = true;
    this.cleanupExpired();
  }

  /**
   * Get a value from the cache
   */
  get<T = unknown>(key: string): T | null {
    this.ensureInitialized();
    if (!this.db) {
      console.log(`[Cache] Database not initialized`);
      return null;
    }

    const now = Date.now();
    
    const stmt = this.db.prepare(`
      SELECT value, expires_at
      FROM cache
      WHERE key = ? AND expires_at > ?
    `);
    
    const row = stmt.get(key, now) as { value: string; expires_at: number } | undefined;

    if (!row) {
      console.log(`[Cache] Cache miss for key: ${key} (now: ${now})`);
      return null;
    }

    console.log(`[Cache] Cache hit for key: ${key} (expires: ${row.expires_at}, now: ${now})`);

    try {
      return JSON.parse(row.value) as T;
    } catch (error) {
      console.error('Failed to parse cached value:', error);
      return null;
    }
  }

  /**
   * Set a value in the cache
   * Only caches valid, non-null, non-undefined values
   */
  set<T = unknown>(key: string, value: T, ttl?: number): void {
    this.ensureInitialized();
    if (!this.db) return;

    // Validate that we're not caching null, undefined, or invalid values
    if (value === null || value === undefined) {
      console.warn(`⚠️  Attempted to cache null/undefined value for key: ${key}, skipping`);
      return;
    }

    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    let valueStr: string;
    try {
      valueStr = JSON.stringify(value);
    } catch (error) {
      console.error(`Failed to serialize value for caching (key: ${key}):`, error);
      return;
    }

    // Don't cache empty strings or invalid JSON
    if (valueStr === '' || valueStr === '{}' || valueStr === '[]') {
      console.warn(`⚠️  Attempted to cache empty/invalid value for key: ${key}, skipping`);
      return;
    }

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO cache (key, value, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(key, valueStr, expiresAt, now);
  }

  /**
   * Delete a specific key
   */
  delete(key: string): void {
    this.ensureInitialized();
    if (!this.db) return;

    const stmt = this.db.prepare('DELETE FROM cache WHERE key = ?');
    stmt.run(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern: string): number {
    this.ensureInitialized();
    if (!this.db) return 0;

    // Count before delete
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM cache WHERE key LIKE ?');
    const countRow = countStmt.get(pattern) as { count: number } | undefined;
    const count = countRow?.count || 0;

    const deleteStmt = this.db.prepare('DELETE FROM cache WHERE key LIKE ?');
    deleteStmt.run(pattern);
    
    return count;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    this.ensureInitialized();
    if (!this.db) return false;

    const now = Date.now();
    
    const stmt = this.db.prepare(`
      SELECT 1 FROM cache WHERE key = ? AND expires_at > ?
    `);
    
    const row = stmt.get(key, now);
    return row !== undefined;
  }

  /**
   * Get all keys matching a pattern
   */
  keys(pattern?: string): string[] {
    this.ensureInitialized();
    if (!this.db) return [];

    const now = Date.now();
    let stmt;
    
    if (pattern) {
      stmt = this.db.prepare('SELECT key FROM cache WHERE key LIKE ? AND expires_at > ?');
      const rows = stmt.all(pattern, now) as { key: string }[];
      return rows.map(row => row.key);
    } else {
      stmt = this.db.prepare('SELECT key FROM cache WHERE expires_at > ?');
      const rows = stmt.all(now) as { key: string }[];
      return rows.map(row => row.key);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.ensureInitialized();
    if (!this.db) return;

    this.db.exec('DELETE FROM cache');
  }

  /**
   * Remove expired entries
   */
  cleanupExpired(): number {
    this.ensureInitialized();
    if (!this.db) return 0;

    const now = Date.now();
    
    // Count expired entries
    const countStmt = this.db.prepare('SELECT COUNT(*) as count FROM cache WHERE expires_at <= ?');
    const countRow = countStmt.get(now) as { count: number } | undefined;
    const count = countRow?.count || 0;
    
    // Delete expired entries
    const deleteStmt = this.db.prepare('DELETE FROM cache WHERE expires_at <= ?');
    deleteStmt.run(now);
    
    return count;
  }

  /**
   * Get cache statistics
   */
  stats(): CacheStats {
    this.ensureInitialized();
    if (!this.db) {
      return { totalEntries: 0, expiredEntries: 0, totalSize: 0 };
    }

    const now = Date.now();
    
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM cache');
    const totalRow = totalStmt.get() as { count: number } | undefined;
    const totalEntries = totalRow?.count || 0;
    
    const expiredStmt = this.db.prepare('SELECT COUNT(*) as count FROM cache WHERE expires_at <= ?');
    const expiredRow = expiredStmt.get(now) as { count: number } | undefined;
    const expiredEntries = expiredRow?.count || 0;
    
    const sizeStmt = this.db.prepare('SELECT SUM(LENGTH(value)) as size FROM cache');
    const sizeRow = sizeStmt.get() as { size: number | null } | undefined;
    const totalSize = sizeRow?.size || 0;

    return {
      totalEntries,
      expiredEntries,
      totalSize,
    };
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }

  /**
   * Vacuum the database to reclaim space
   */
  vacuum(): void {
    this.ensureInitialized();
    if (!this.db) return;

    this.db.exec('VACUUM');
  }
}

// Singleton instance for shared access
let cacheInstance: SQLiteCache | null = null;

/**
 * Get or create the shared cache instance
 */
export function getCache(options?: {
  dbPath?: string;
  defaultTTL?: number;
}): SQLiteCache {
  if (!cacheInstance) {
    console.log('[Cache] Creating new cache instance');
    cacheInstance = new SQLiteCache(options);
  } else {
    console.log('[Cache] Returning existing cache instance');
  }
  return cacheInstance;
}

/**
 * Close the shared cache instance
 */
export function closeCache(): void {
  if (cacheInstance) {
    cacheInstance.close();
    cacheInstance = null;
  }
}
