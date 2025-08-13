import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PlaceBidsService } from './services/place-bids.service';
import { HttpAuthGuard } from '../common/guards/http-auth.guard';
import { MyBidsService } from './services/my-bids.service';

@Controller('bids')
@UseGuards(HttpAuthGuard)
export class BidsController {
  constructor(
    private readonly placeBidsService: PlaceBidsService,
    private readonly myBidsService: MyBidsService
  ) {}

  @Get('auction/:auctionId')
  async getBidsByAuction(@Param('auctionId') auctionId: string) {
    return this.placeBidsService.getBidsByAuction(auctionId);
  }

  @Get('my-bids')
  async getMyBids(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.myBidsService.getBidsByUser(userId);
  }
}
