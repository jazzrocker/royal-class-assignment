import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuctionCronService } from './auction-cron.service';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CommonModule, // Only need this for RabbitMQService
  ],
  providers: [AuctionCronService],
  exports: [AuctionCronService],
})
export class AuctionCronModule {}
