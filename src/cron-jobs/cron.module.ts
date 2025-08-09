import { Module } from '@nestjs/common';
import { AuctionCronModule } from './auction/auction-cron.module';

@Module({
  imports: [
    AuctionCronModule,
    // Add other cron job modules here as they are created
    // Example: UserCronModule,
    // Example: NotificationCronModule,
  ],
  exports: [
    AuctionCronModule,
    // Export other cron modules as needed
  ],
})
export class CronModule {}
