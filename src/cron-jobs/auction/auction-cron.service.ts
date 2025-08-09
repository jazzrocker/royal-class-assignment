import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Auction } from "../../common/schemas/auction.schema";
import { RedisService } from "../../common/redis/redis.service";
import { AUCTION_STATUS } from "src/common/constants/auction.constants";
import { Bids } from "src/common/schemas/bids.schema";
import { User } from "src/common/schemas/user.schema";
import { RoomEmitter } from "src/websocket/emitters/room.emitter";

@Injectable()
export class AuctionCronService {
  private readonly logger = new Logger(AuctionCronService.name);

  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<Auction>,
    @InjectModel(Bids.name) private bidsModel: Model<Bids>,
    @InjectModel(User.name) private userModel: Model<User>,
      private redisService: RedisService,
      private roomEmitter: RoomEmitter
  ) {}

  /**
   * Check for active auctions every 5 minutes
   * Logs details of auctions that have started (startTime has passed)
   * Saves active auctions to Redis with key 'activeAuction:_id'
   */
  @Cron('0 * * * * *')
  async auctionCron() {
    this.logger.log("Checking for active auctions...");

    try {

      await this.saveActiveAuctionsToRedis();
      await this.triggerAuctionResultAnnouncement();
    
    } catch (error) {
      this.logger.error("Error checking active auctions:", error);
    }
  }

  async saveActiveAuctionsToRedis() {
    this.logger.log("Saving active auctions to Redis...");
    try {
      const currentTime = new Date();

      // Find all auctions where startTime has passed but endTime hasn't
      const activeAuctions = await this.auctionModel
        .find({
          startTime: { $lte: currentTime },
          status: { $eq: AUCTION_STATUS.ACTIVE },
        })
        .exec();
      for (const auction of activeAuctions) {
        const redisKey = `activeAuction:${auction._id}`;
        const auctionData = {
          _id: auction._id,
          title: auction.title,
          startTime: auction.startTime,
          endTime: auction.endTime,
          status: AUCTION_STATUS.ACTIVE,
          startingBid: auction.startingBid,
          currentHighestBid: auction.currentHighestBid,
          participantsCount: auction.participants?.length || 0,
          allParticipantsCount: auction.allParticipants?.length || 0,
          lastUpdated: new Date().toISOString(),
        };

        await this.redisService.set(redisKey, auctionData);

        await this.auctionModel.findByIdAndUpdate(auction._id, {
          status: AUCTION_STATUS.ACTIVE,
        });
      }
    } catch (error) {
      this.logger.error("Error saving active auctions to Redis:", error);
    }
  }

  async triggerAuctionResultAnnouncement() {
    this.logger.log("Triggering auction result announcement...");
    try {
      const allAuctionsRedisKeys = await this.redisService.keys("activeAuction:*");
      for (const auctionKey of allAuctionsRedisKeys) {
        const auctionData = await this.redisService.get(auctionKey);
        const endTime = new Date(auctionData.endTime);
        if (endTime <= new Date()) {
          this.logger.log(`Auction ${auctionData._id} has ended`);
          const highestBid = await this.bidsModel.findOne({ auctionId: auctionData._id }).sort({ bidAmount: -1 }).exec();
          if (highestBid) {
            const winner = await this.userModel.findById(highestBid.userId).exec();
            await this.auctionModel.findByIdAndUpdate(auctionData._id, { status: "completed", winnerId: winner?._id , bidId: highestBid?._id});
            await this.redisService.del(auctionKey);
            this.roomEmitter.emitGlobalNotification(`${winner?.name} has won the auction: ${auctionData.title}`);
            this.roomEmitter.emitGlobalAuctionEnded(`${auctionData.title} has ended`);
          } else {
            await this.auctionModel.findByIdAndUpdate(auctionData._id, { status: "completed" });
            await this.redisService.del(auctionKey);
            this.roomEmitter.emitGlobalAuctionEnded(`${auctionData.title} has ended`);
          }
        }
      }
    } catch (error) {
      this.logger.error("Error triggering auction result announcement:", error);
    }
  }
}
