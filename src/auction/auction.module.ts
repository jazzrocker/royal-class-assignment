import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuctionController } from './auction.controller';
import { CreateAuctionService } from './services/create-auction.service';
import { ListAuctionsService } from './services/list-auctions.service';
import { JoinAuctionService } from './services/join-auction.service';
import { AuctionHelperService } from './services/auction-helper.service';
import { Auction, AuctionSchema } from 'src/common/schemas/auction.schema';
import { Bids, BidsSchema } from 'src/common/schemas/bids.schema';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: Bids.name, schema: BidsSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    CommonModule,
  ],
  controllers: [AuctionController],
  providers: [CreateAuctionService, ListAuctionsService, JoinAuctionService, AuctionHelperService],
  exports: [CreateAuctionService, ListAuctionsService, JoinAuctionService, AuctionHelperService],
})
export class AuctionModule {}
