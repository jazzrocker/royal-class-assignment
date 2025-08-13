import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BidsController } from './bids.controller';
import { PlaceBidsService } from './services/place-bids.service';
import { Bids, BidsSchema } from '../common/schemas/bids.schema';
import { Auction, AuctionSchema } from '../common/schemas/auction.schema';
import { User, UserSchema } from '../common/schemas/user.schema';
import { CommonModule } from '../common/common.module';
import { AuctionModule } from '../auction/auction.module';
import { MyBidsService } from './services/my-bids.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bids.name, schema: BidsSchema },
      { name: Auction.name, schema: AuctionSchema },
      { name: User.name, schema: UserSchema }
    ]),
    CommonModule,
    AuctionModule,
  ],
  controllers: [BidsController],
  providers: [PlaceBidsService, MyBidsService],
  exports: [PlaceBidsService, MyBidsService]
})
export class BidsModule {}
