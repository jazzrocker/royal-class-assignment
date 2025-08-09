import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketModule } from './websocket/websocket.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { AuctionModule } from './auction/auction.module';
import { CronModule } from './cron-jobs/cron.module';
import { BidsModule } from './bids/bids.module';

@Module({
  imports: [WebsocketModule, CommonModule, AuthModule, AuctionModule, CronModule, BidsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
