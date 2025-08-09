import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Auction } from "../../common/schemas/auction.schema";
import { RedisService } from "../../common/redis/redis.service";
import { Bids } from "src/common/schemas/bids.schema";

@Injectable()
export class AuctionHelperService {
  private readonly logger = new Logger(AuctionHelperService.name);

  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<Auction>,
    @InjectModel(Bids.name) private bidsModel: Model<Bids>,
    private redisService: RedisService
  ) {}

  /**
   * Get auction details from Redis first, fallback to database
   * @param auctionId - The auction ID to search for
   * @returns Auction details or throws NotFoundException
   */
  async getAuctionDetails(auctionId: string): Promise<any> {
    try {
      // First, try to get from Redis
      const redisKey = `activeAuction:${auctionId}`;
      let auction = await this.redisService.get(redisKey);

      if (auction) {
        auction.bids = await this.bidsModel
          .find({ auctionId: auctionId })
          .exec();
        return auction;
      }

      auction = await this.auctionModel.findById(auctionId).exec();

      if (!auction) {
        throw new NotFoundException(`Auction with ID ${auctionId} not found`);
      }
      auction.bids = await this.bidsModel.find({ auctionId: auctionId }).exec();
      return auction;
    } catch (error) {
      this.logger.error(
        `Error getting auction details for ${auctionId}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Validates if a date is in the future
   */
  isDateInFuture(date: Date): boolean {
    return date > new Date();
  }

  /**
   * Validates if end time is after start time
   */
  isEndTimeAfterStartTime(startTime: Date, endTime: Date): boolean {
    return endTime > startTime;
  }

  /**
   * Formats auction data for response
   */
  formatAuctionResponse(auction: any) {
    return {
      _id: auction._id.toString(),
      carId: auction.carId?.toString(),
      title: auction.title,
      startTime: auction.startTime.toISOString(),
      endTime: auction.endTime.toISOString(),
      startingBid: auction.startingBid,
      currentHighestBid: auction.currentHighestBid,
      winnerId: auction.winnerId?.toString(),
      bidId: auction.bidId?.toString(),
      status: auction.status,
      participants: auction.participants.map((id: any) => id.toString()),
      allParticipants: auction.allParticipants.map((id: any) => id.toString()),
    };
  }
}
