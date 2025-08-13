import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './websocket/websocket.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { AuctionModule } from './auction/auction.module';
import { CronModule } from './cron-jobs/cron.module';
import { BidsModule } from './bids/bids.module';
import { ResultModule } from './result/result.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 2000, // 2 seconds in milliseconds
      limit: 1, // 1 request per ttl window
    }]),
    WebsocketModule, 
    CommonModule, 
    AuthModule, 
    AuctionModule, 
    CronModule, 
    BidsModule,
    ResultModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
