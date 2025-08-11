import { Injectable, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { Socket } from 'socket.io';

/**
 * Place Bid Throttler Guard
 * 
 * Implements strict rate limiting for placeBid WebSocket events:
 * - 1 request per 5 seconds for placeBid operations
 * 
 * Usage: Apply specifically to placeBid WebSocket handlers
 */
@Injectable()
export class PlaceBidThrottlerGuard extends ThrottlerGuard {

  /**
   * Get throttler options specifically for bid operations
   */
  protected getThrottlers(context: ExecutionContext): Promise<ThrottlerOptions[]> {
    return Promise.resolve([
      {
        name: 'placeBid',
        ttl: 5000, // 5 seconds
        limit: 1,  // 1 request per 5 seconds
      },
    ]);
  }

  /**
   * Generate a unique key for each client's bid operations
   */
  protected generateKey(context: ExecutionContext, tracker: string, suffix: string): string {
    const client: Socket = context.switchToWs().getClient();
    const userId = client.data?.socketUserData?.userId || client.data?.socketUserData?.id || client.id;
    
    // Include auction ID for more granular control per auction
    const data = context.getArgs()[0]; // Get the message body
    const auctionId = data?.auctionId || 'unknown';
    
    return `${tracker}-${suffix}-bid-${userId}-${auctionId}`;
  }

  /**
   * Get tracker string for bid operations
   */
  protected getTracker(req: Record<string, any>): Promise<string> {
    const client: Socket = req as any;
    const userId = client.data?.socketUserData?.userId || client.data?.socketUserData?.id || client.id;
    
    return Promise.resolve(`bid-${userId}`);
  }

  /**
   * Check if throttling should be skipped for bid operations
   */
  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    
    // Skip for admin users only
    if (client.data?.socketUserData?.role === 'admin') {
      return Promise.resolve(true);
    }
    
    // Never skip for regular users - bid throttling is critical
    return Promise.resolve(false);
  }

  /**
   * Override canActivate to provide detailed logging and custom error handling for bid attempts
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const data = context.getArgs()[0];
    const userId = client.data?.socketUserData?.userId || client.data?.socketUserData?.id || client.id;
    const auctionId = data?.auctionId || 'unknown';
    
    console.log(`[PlaceBidThrottler] User ${userId} attempting to place bid for auction ${auctionId}`);
    
    try {
      const result = await super.canActivate(context);
      console.log(`[PlaceBidThrottler] User ${userId} bid attempt allowed`);
      return result;
    } catch (error) {
      console.log(`[PlaceBidThrottler] User ${userId} bid attempt throttled`);
      
      // Emit specific bid error event to the client
      client.emit('bid-throttle-error', {
        error: 'Bid rate limit exceeded',
        message: 'You can only place one bid every 5 seconds. Please wait before placing another bid.',
        retryAfter: 5,
        auctionId: auctionId,
        timestamp: new Date().toISOString(),
        severity: 'warning',
      });
      
      // Also emit general error for backward compatibility
      client.emit('bid-placed-error', {
        error: 'Rate limit exceeded',
        message: 'Please wait 5 seconds before placing another bid.',
        auctionId: auctionId,
      });
      
      // Throw WebSocket exception
      throw new WsException({
        error: 'Bid rate limit exceeded',
        message: 'You can only place one bid every 5 seconds.',
        retryAfter: 5,
        auctionId: auctionId,
      });
    }
  }
}
