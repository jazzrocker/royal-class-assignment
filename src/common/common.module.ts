import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WsAuthGuard, HttpAuthGuard, WsThrottlerGuard } from './guards';
import { DatabaseModule } from './database/database.module';
import { RedisService } from './redis/redis.service';
import { RoomEmitter } from '../websocket/emitters/room.emitter';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [
    JwtModule.register({
      secret: 'your-secret-key', // Using the default secret
      signOptions: { 
        expiresIn: process.env.JWT_EXPIRES_IN || '1d' 
      },
    }),
    DatabaseModule,
    RabbitMQModule,
  ],
  providers: [
    WsAuthGuard,
    HttpAuthGuard,
    WsThrottlerGuard,
    RedisService,
    RoomEmitter,
  ],
  exports: [
    WsAuthGuard,
    HttpAuthGuard,
    WsThrottlerGuard,
    JwtModule,
    DatabaseModule,
    RedisService,
    RoomEmitter,
    RabbitMQModule,
  ],
})
export class CommonModule {}
