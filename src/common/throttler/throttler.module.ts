import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { BaseThrottlerGuard } from './base-throttler.guard';
import { WebSocketThrottlerGuard } from './websocket-throttler.guard';
import { PlaceBidThrottlerGuard } from './place-bid-throttler.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 1000, // 1 second
        limit: 1,  // 1 request per 1 second
      },
    ]),
  ],
  providers: [
    BaseThrottlerGuard,
    WebSocketThrottlerGuard,
    PlaceBidThrottlerGuard,
  ],
  exports: [
    ThrottlerModule,
    BaseThrottlerGuard,
    WebSocketThrottlerGuard,
    PlaceBidThrottlerGuard,
  ],
})
export class ThrottlerConfigModule {}
