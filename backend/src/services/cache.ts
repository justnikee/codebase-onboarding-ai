/**
 * Smart Caching Service
 * Provides instant results for previously analyzed repositories
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { RepositoryContext } from '../types/index.js';

interface CacheMetadata {
  repoUrl: string;
  contextId: string;
  cachedAt: number;
  expiresAt: number;
  size: number;
}

class CacheService {
  private readonly cacheDir = path.join(process.cwd(), 'src', 'storage', 'cache');
  private readonly metadataFile = path.join(this.cacheDir, '_metadata.json');
  private readonly cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
  private metadata: Map<string, CacheMetadata> = new Map();

  constructor() {
    this.ensureCacheDir();
    this.loadMetadata();
  }

  /**
   * Ensures cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Loads cache metadata
   */
  private async loadMetadata(): Promise<void> {
    try {
      const data = await fs.readFile(this.metadataFile, 'utf-8');
      const entries = JSON.parse(data) as Array<[string, CacheMetadata]>;
      this.metadata = new Map(entries);
      
      // Clean expired entries
      await this.cleanExpired();
    } catch (error) {
      // Metadata file doesn't exist yet, that's okay
      this.metadata = new Map();
    }
  }

  /**
   * Saves cache metadata
   */
  private async saveMetadata(): Promise<void> {
    try {
      const entries = Array.from(this.metadata.entries());
      await fs.writeFile(
        this.metadataFile,
        JSON.stringify(entries, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save cache metadata:', error);
    }
  }

  /**
   * Generates cache key from repository URL
   */
  private getCacheKey(repoUrl: string): string {
    return crypto
      .createHash('md5')
      .update(repoUrl.toLowerCase().trim())
      .digest('hex');
  }

  /**
   * Gets cache file path
   */
  private getCachePath(cacheKey: string): string {
    return path.join(this.cacheDir, `${cacheKey}.json`);
  }

  /**
   * Checks if cache exists and is valid
   */
  async has(repoUrl: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(repoUrl);
    const meta = this.metadata.get(cacheKey);

    if (!meta) {
      return false;
    }

    // Check if expired
    if (Date.now() > meta.expiresAt) {
      await this.delete(repoUrl);
      return false;
    }

    // Check if file exists
    try {
      await fs.access(this.getCachePath(cacheKey));
      return true;
    } catch {
      // File doesn't exist, remove from metadata
      this.metadata.delete(cacheKey);
      await this.saveMetadata();
      return false;
    }
  }

  /**
   * Gets cached context
   */
  async get(repoUrl: string): Promise<RepositoryContext | null> {
    const cacheKey = this.getCacheKey(repoUrl);
    
    if (!(await this.has(repoUrl))) {
      return null;
    }

    try {
      const cachePath = this.getCachePath(cacheKey);
      const data = await fs.readFile(cachePath, 'utf-8');
      const context = JSON.parse(data) as RepositoryContext;
      
      console.log(`✅ Cache HIT for ${repoUrl}`);
      return context;
    } catch (error) {
      console.error('Failed to read cache:', error);
      return null;
    }
  }

  /**
   * Saves context to cache
   */
  async set(repoUrl: string, context: RepositoryContext): Promise<void> {
    const cacheKey = this.getCacheKey(repoUrl);
    const cachePath = this.getCachePath(cacheKey);

    try {
      // Save context
      const data = JSON.stringify(context, null, 2);
      await fs.writeFile(cachePath, data, 'utf-8');

      // Update metadata
      const stats = await fs.stat(cachePath);
      this.metadata.set(cacheKey, {
        repoUrl,
        contextId: context.contextId,
        cachedAt: Date.now(),
        expiresAt: Date.now() + this.cacheDuration,
        size: stats.size,
      });

      await this.saveMetadata();
      console.log(`💾 Cached analysis for ${repoUrl}`);
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  /**
   * Deletes cached context
   */
  async delete(repoUrl: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(repoUrl);
    const cachePath = this.getCachePath(cacheKey);

    try {
      await fs.unlink(cachePath);
      this.metadata.delete(cacheKey);
      await this.saveMetadata();
      console.log(`🗑️  Deleted cache for ${repoUrl}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleans expired cache entries
   */
  async cleanExpired(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, meta] of this.metadata.entries()) {
      if (now > meta.expiresAt) {
        try {
          await fs.unlink(this.getCachePath(key));
          this.metadata.delete(key);
          cleaned++;
        } catch {
          // File already deleted
          this.metadata.delete(key);
        }
      }
    }

    if (cleaned > 0) {
      await this.saveMetadata();
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Gets cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    let totalSize = 0;
    let oldestEntry: Date | null = null;
    let newestEntry: Date | null = null;

    for (const meta of this.metadata.values()) {
      totalSize += meta.size;
      
      const cachedDate = new Date(meta.cachedAt);
      if (!oldestEntry || cachedDate < oldestEntry) {
        oldestEntry = cachedDate;
      }
      if (!newestEntry || cachedDate > newestEntry) {
        newestEntry = cachedDate;
      }
    }

    return {
      totalEntries: this.metadata.size,
      totalSize,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Lists all cached repositories
   */
  async list(): Promise<Array<{
    repoUrl: string;
    contextId: string;
    cachedAt: Date;
    expiresAt: Date;
    size: number;
  }>> {
    return Array.from(this.metadata.values()).map(meta => ({
      repoUrl: meta.repoUrl,
      contextId: meta.contextId,
      cachedAt: new Date(meta.cachedAt),
      expiresAt: new Date(meta.expiresAt),
      size: meta.size,
    }));
  }

  /**
   * Clears all cache
   */
  async clear(): Promise<number> {
    let cleared = 0;

    for (const key of this.metadata.keys()) {
      try {
        await fs.unlink(this.getCachePath(key));
        cleared++;
      } catch {
        // Ignore errors
      }
    }

    this.metadata.clear();
    await this.saveMetadata();
    
    console.log(`🧹 Cleared ${cleared} cache entries`);
    return cleared;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Made with Bob
