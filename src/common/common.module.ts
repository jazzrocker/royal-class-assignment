import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WsAuthGuard, HttpAuthGuard } from './guards';
import { DatabaseModule } from './database/database.module';
import { RedisService } from './redis/redis.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'your-secret-key', // Using the default secret
      signOptions: { 
        expiresIn: process.env.JWT_EXPIRES_IN || '1d' 
      },
    }),
    DatabaseModule,
  ],
  providers: [
    WsAuthGuard,
    HttpAuthGuard,
    RedisService,
  ],
  exports: [
    WsAuthGuard,
    HttpAuthGuard,
    JwtModule,
    DatabaseModule,
    RedisService,
  ],
})
export class CommonModule {}
