import { Controller, Post, Body, Get, UseGuards, Request, Query } from '@nestjs/common';
import { CreateAuctionService } from './services/create-auction.service';
import { ListAuctionsService } from './services/list-auctions.service';
import { HttpAuthGuard } from 'src/common/guards/http-auth.guard';
import { CreateAuctionDto, AuctionResponseDto, ListAuctionsDto, AuctionListResponseDto } from './dto';

@Controller('auction')
export class AuctionController {
  constructor(
    private readonly createAuctionService: CreateAuctionService,
    private readonly listAuctionsService: ListAuctionsService,
  ) {}

  @Post('create')
  @UseGuards(HttpAuthGuard)
  async createAuction(
    @Body() createAuctionDto: CreateAuctionDto,
    @Request() req: any,
  ): Promise<AuctionResponseDto> {
    return await this.createAuctionService.createAuction(
      createAuctionDto,
      req.user.userId,
    );
  }

  @Get('active')
  async listAuctions(@Query() listAuctionsDto: ListAuctionsDto){
    return await this.listAuctionsService.listAuctions(listAuctionsDto);
  }
}
