import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { AuctionCronService } from './auction-cron.service';
import { Auction, AuctionSchema } from '../../common/schemas/auction.schema';
import { Bids, BidsSchema } from '../../common/schemas/bids.schema';
import { User, UserSchema } from '../../common/schemas/user.schema';
import { CommonModule } from '../../common/common.module';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: Bids.name, schema: BidsSchema },
      { name: User.name, schema: UserSchema }
    ]),
    CommonModule,
    WebsocketModule,
  ],
  providers: [AuctionCronService],
  exports: [AuctionCronService],
})
export class AuctionCronModule {}
