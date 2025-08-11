import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Base HTTP Throttler Guard
 * 
 * Implements rate limiting for HTTP requests:
 * - 1 request per 1 second for all HTTP endpoints
 * 
 * Usage: Apply to controllers or specific routes
 */
@Injectable()
export class BaseThrottlerGuard extends ThrottlerGuard {
  
  /**
   * Generate a unique key for each client based on IP address and user ID
   */
  protected generateKey(context: ExecutionContext, tracker: string, suffix: string): string {
    const request = this.getRequestResponse(context).req;
    const clientIp = request.ip || request.connection.remoteAddress || 'unknown';
    
    // Include user ID if authenticated for more granular control
    const userId = request.user?.userId || request.user?.id || 'anonymous';
    
    return `${tracker}-${suffix}-${clientIp}-${userId}`;
  }

  /**
   * Get tracker string for HTTP requests
   */
  protected getTracker(req: Record<string, any>): Promise<string> {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user?.userId || req.user?.id || 'anonymous';
    
    return Promise.resolve(`http-${clientIp}-${userId}`);
  }

  /**
   * Check if throttling should be skipped for this request
   */
  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequestResponse(context).req;
    
    // Skip throttling for health check endpoints
    if (request.url?.includes('/health') || request.url?.includes('/status')) {
      return Promise.resolve(true);
    }
    
    // Skip for admin users (if role-based access is implemented)
    if (request.user?.role === 'admin') {
      return Promise.resolve(true);
    }
    
    return Promise.resolve(false);
  }
}
