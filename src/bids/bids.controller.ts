import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PlaceBidsService } from './services/place-bids.service';
import { PlaceBidDto, PlaceBidResponseDto } from './dto/place-bid.dto';
import { HttpAuthGuard } from '../common/guards/http-auth.guard';

@Controller('bids')
@UseGuards(HttpAuthGuard)
export class BidsController {
  constructor(private readonly placeBidsService: PlaceBidsService) {}

  @Get('auction/:auctionId')
  async getBidsByAuction(@Param('auctionId') auctionId: string) {
    return this.placeBidsService.getBidsByAuction(auctionId);
  }

  @Get('user/:userId')
  async getBidsByUser(@Param('userId') userId: string) {
    return this.placeBidsService.getBidsByUser(userId);
  }

  @Get('my-bids')
  async getMyBids(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.placeBidsService.getBidsByUser(userId);
  }
}
