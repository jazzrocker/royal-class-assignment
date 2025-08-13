import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context, limit, ttl, blockDuration, throttler } = requestProps;
    const client = context.switchToWs().getClient();
    
    // Use client ID and user ID for throttling key
    const userId = client.data?.socketUserData?.userId || client.data?.socketUserData?.id;
    const throttlerName = throttler.name || 'default';
    const key = this.generateKey(context, `${client.id}-${userId || 'anonymous'}`, throttlerName);
    
    const { totalHits, timeToBlockExpire } = await this.storageService.increment(
      key, 
      ttl, 
      limit, 
      blockDuration, 
      throttlerName
    );

    if (totalHits > limit) {
      // Emit throttle error to client instead of throwing HTTP exception
      client.emit('throttle-error', {
        message: `Rate limit exceeded. Try again in ${Math.round(timeToBlockExpire / 1000)} seconds.`,
        retryAfter: timeToBlockExpire,
        limit,
        ttl,
      });
      
      // Throw WebSocket exception
      throw new WsException({
        message: 'Rate limit exceeded',
        retryAfter: timeToBlockExpire,
      });
    }

    return true;
  }

  protected getTracker(req: Record<string, any>): Promise<string> {
    // For WebSocket, use client ID
    return Promise.resolve(req.id || req.handshake?.address || 'anonymous');
  }
}
