import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: RedisClientType;

  async onModuleInit() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.redisClient.on('error', (err) => {
        this.logger.error('Redis Client Error:', err);
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis Client Connected');
      });

      await this.redisClient.connect();
      this.logger.log('Redis service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis service:', error);
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Set a key-value pair in Redis
   * @param key - Redis key
   * @param payload - Data to store (will be JSON stringified)
   * @param ttl - Time to live in seconds (optional)
   */
  async set(key: string, payload: any, ttl?: number): Promise<void> {
    try {
      const value = JSON.stringify(payload);
      if (ttl) {
        await this.redisClient.setEx(key, ttl, value);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting Redis key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value from Redis by key
   * @param key - Redis key
   * @returns Parsed data or null if not found
   */
  async get(key: string): Promise<any> {
    try {
      const value = await this.redisClient.get(key);
      if (value) {
        const parsed = JSON.parse(value);
        return parsed;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error getting Redis key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete a key from Redis
   * @param key - Redis key to delete
   */
  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.logger.log(`Redis DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting Redis key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists in Redis
   * @param key - Redis key to check
   * @returns boolean indicating if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking Redis key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get all keys matching a pattern
   * @param pattern - Redis pattern (e.g., 'activeAuction:*')
   * @returns Array of matching keys
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const keys = await this.redisClient.keys(pattern);
      return keys;
    } catch (error) {
      this.logger.error(`Error getting Redis keys with pattern ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * Set multiple key-value pairs
   * @param data - Object with key-value pairs
   * @param ttl - Time to live in seconds (optional)
   */
  async mset(data: Record<string, any>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.redisClient.multi();
      
      for (const [key, value] of Object.entries(data)) {
        const stringValue = JSON.stringify(value);
        if (ttl) {
          pipeline.setEx(key, ttl, stringValue);
        } else {
          pipeline.set(key, stringValue);
        }
      }
      
      await pipeline.exec();
      this.logger.log(`Redis MSET: ${Object.keys(data).length} keys`);
    } catch (error) {
      this.logger.error('Error in Redis MSET:', error);
      throw error;
    }
  }

  /**
   * Get multiple values by keys
   * @param keys - Array of Redis keys
   * @returns Object with key-value pairs
   */
  async mget(keys: string[]): Promise<Record<string, any>> {
    try {
      const values = await this.redisClient.mGet(keys);
      const result: Record<string, any> = {};
      
      keys.forEach((key, index) => {
        if (values[index]) {
          try {
            result[key] = JSON.parse(values[index]);
          } catch {
            result[key] = values[index];
          }
        }
      });
      
      this.logger.log(`Redis MGET: ${keys.length} keys`);
      return result;
    } catch (error) {
      this.logger.error('Error in Redis MGET:', error);
      throw error;
    }
  }
}
