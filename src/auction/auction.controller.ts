import { Controller, Post, Body, Get, UseGuards, Request, Query } from '@nestjs/common';
import { CreateAuctionService } from './services/create-auction.service';
import { ListAuctionsService } from './services/list-auctions.service';
import { HttpAuthGuard } from 'src/common/guards/http-auth.guard';
import { CreateAuctionDto, AuctionResponseDto, ListAuctionsDto, AuctionListResponseDto } from './dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('auction')
export class AuctionController {
  constructor(
    private readonly createAuctionService: CreateAuctionService,
    private readonly listAuctionsService: ListAuctionsService,
  ) {}

  @Post('create')
  @UseGuards(HttpAuthGuard)
  @Throttle({ default: { limit: 1, ttl: 5000 } }) // 1 req per 5 seconds
  @UseGuards(ThrottlerGuard)
  async createAuction(
    @Body() createAuctionDto: CreateAuctionDto,
    @Request() req: any,
  ) {
    return await this.createAuctionService.createAuction(
      createAuctionDto,
      req.user.userId,
    );
  }

  @Get('active')
  @Throttle({ default: { limit: 1, ttl: 1000 } }) // 1 req per 1 second
  @UseGuards(ThrottlerGuard)
  async listAuctions(@Query() listAuctionsDto: ListAuctionsDto){
    return await this.listAuctionsService.listAuctions(listAuctionsDto);
  }
}
