import { Injectable, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Socket } from 'socket.io';

/**
 * WebSocket Throttler Guard
 * 
 * Implements rate limiting for WebSocket events:
 * - 1 request per 1 second for WebSocket events
 * - Uses 'default' throttler configuration
 * 
 * Usage: Apply to WebSocket gateways
 */
@Injectable()
export class WebSocketThrottlerGuard extends ThrottlerGuard {

  /**
   * Generate a unique key for each WebSocket client
   */
  protected generateKey(context: ExecutionContext, tracker: string, suffix: string): string {
    const client: Socket = context.switchToWs().getClient();
    const userId = client.data?.socketUserData?.userId || client.data?.socketUserData?.id || client.id;
    const eventName = context.getHandler().name;
    
    return `websocket-${userId}-${eventName}-${suffix}`;
  }

  /**
   * Get tracker string for WebSocket connections
   */
  protected getTracker(req: Record<string, any>): Promise<string> {
    const client: Socket = req as any;
    const userId = client.data?.socketUserData?.userId || client.data?.socketUserData?.id || client.id;
    
    return Promise.resolve(`websocket-${userId}`);
  }

  /**
   * Check if throttling should be skipped for this WebSocket event
   */
  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const eventName = context.getHandler().name;
    
    // Skip for admin users only
    if (client.data?.socketUserData?.role === 'admin') {
      return Promise.resolve(true);
    }
    
    // Skip for connection/disconnection events only
    if (eventName === 'handleConnection' || eventName === 'handleDisconnect') {
      return Promise.resolve(true);
    }
    
    // DO NOT skip for any other events - throttle everything else
    return Promise.resolve(false);
  }

  /**
   * Override canActivate to handle WebSocket throttling with custom error handling
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return await super.canActivate(context);
    } catch (error) {
      const client: Socket = context.switchToWs().getClient();
      const eventName = context.getHandler().name;
      
      // Emit error event to the client
                client.emit('throttle-error', {
            error: 'Rate limit exceeded',
            message: `Too many ${eventName} requests. Try again in 1 second.`,
            retryAfter: 1,
            event: eventName,
            timestamp: new Date().toISOString(),
          });
      
      // Throw WebSocket exception
      throw new WsException({
        error: 'Rate limit exceeded',
        message: `Too many ${eventName} requests. Please wait 1 second.`,
        retryAfter: 1,
      });
    }
  }
}
