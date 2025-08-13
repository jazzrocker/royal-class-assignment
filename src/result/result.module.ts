import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResultController } from './result.controller';
import { SaveActiveAuctionsService } from './services/save-active-auctions.service';
import { TriggerAuctionResultsService } from './services/trigger-auction-results.service';
import { CommonModule } from '../common/common.module';
import { Auction, AuctionSchema } from '../common/schemas/auction.schema';
import { Bids, BidsSchema } from '../common/schemas/bids.schema';
import { User, UserSchema } from '../common/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: Bids.name, schema: BidsSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CommonModule,
  ],
  controllers: [ResultController],
  providers: [
    SaveActiveAuctionsService,
    TriggerAuctionResultsService,
  ],
  exports: [
    SaveActiveAuctionsService,
    TriggerAuctionResultsService,
  ],
})
export class ResultModule {}
