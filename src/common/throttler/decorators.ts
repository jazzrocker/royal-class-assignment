import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Custom throttler decorators for different rate limits
 */

// Strict throttling for critical operations (1 request per 5 seconds)
export const StrictThrottle = () => Throttle({ placeBid: { ttl: 5000, limit: 1 } });

// Standard throttling for regular operations (1 request per 2 seconds)
export const StandardThrottle = () => Throttle({ default: { ttl: 2000, limit: 1 } });

// Relaxed throttling for read operations (5 requests per 2 seconds)
export const RelaxedThrottle = () => Throttle({ default: { ttl: 2000, limit: 5 } });

// WebSocket throttling (1 request per 2 seconds)
export const WebSocketThrottle = () => Throttle({ websocket: { ttl: 2000, limit: 1 } });

/**
 * Metadata keys for throttler configuration
 */
export const THROTTLER_SKIP = 'throttler:skip';
export const THROTTLER_LIMIT = 'throttler:limit';
export const THROTTLER_TTL = 'throttler:ttl';

/**
 * Skip throttling for specific endpoints
 */
export const SkipThrottleForEndpoint = () => SetMetadata(THROTTLER_SKIP, true);
