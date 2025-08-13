import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Auction, AuctionDocument } from 'src/common/schemas/auction.schema';
import { CreateAuctionDto, AuctionResponseDto } from '../dto';
import { AuctionHelperService } from './auction-helper.service';
import { RESPONSE_CONSTANTS } from 'src/common/constants/response.constants';
import { ServiceError } from 'src/common/errors/service.error';
import { ResponseFormatter } from 'src/common/helper/response-formatter.helper';

@Injectable()
export class CreateAuctionService {
  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<AuctionDocument>,
    private auctionHelperService: AuctionHelperService,
  ) {}

  async createAuction(createAuctionDto: CreateAuctionDto, userId: string){
    // Validate that end time is after start time
    const startTime = new Date(createAuctionDto.startTime);
    const endTime = new Date(createAuctionDto.endTime);

    if (!this.auctionHelperService.isEndTimeAfterStartTime(startTime, endTime)) {
      throw new ServiceError(RESPONSE_CONSTANTS.END_TIME_MUST_BE_AFTER_START_TIME);
    }

    // Validate that start time is in the future
    if (!this.auctionHelperService.isDateInFuture(startTime)) {
      throw new ServiceError(RESPONSE_CONSTANTS.START_TIME_MUST_BE_IN_FUTURE);
    }

    // Create auction data
    const startingBid = Number(createAuctionDto.startingBid);
    const auctionData = {
      carId: createAuctionDto.carId ? new Types.ObjectId(createAuctionDto.carId) : null,
      title: createAuctionDto.title,
      startTime: startTime,
      endTime: endTime,
      startingBid: startingBid,
      currentHighestBid: startingBid,
      status: 'active',
      participants: [],
      allParticipants: [],
    };
    // Create the auction
    const newAuction = await this.auctionModel.create(auctionData);

    // Return the created auction using response formatter
    return ResponseFormatter.success(
      newAuction,
      "Auction created successfully"
    );
  }
}
