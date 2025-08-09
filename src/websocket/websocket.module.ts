import { Module } from '@nestjs/common';
import { RoomController } from './controllers/room.controller';
import { RoomEmitter } from './emitters/room.emitter';
import { WsHelperService } from './services/ws-helper.service';
import { CommonModule } from '../common/common.module';
import { BidsModule } from '../bids/bids.module';
import { AuctionModule } from '../auction/auction.module';

@Module({
  imports: [CommonModule, BidsModule, AuctionModule],
  providers: [
    RoomController,
    RoomEmitter,
    WsHelperService,
  ],
  exports: [
    RoomController,
    RoomEmitter,
    WsHelperService,
  ],
})
export class WebsocketModule {}
