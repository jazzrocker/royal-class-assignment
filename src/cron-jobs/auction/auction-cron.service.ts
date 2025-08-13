import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { RabbitMQService } from "src/common/rabbitmq/rabbitmq.service";

@Injectable()
export class AuctionCronService {
  private readonly logger = new Logger(AuctionCronService.name);

  constructor(
    private rabbitMQService: RabbitMQService
  ) {}

  /**
   * Check for active auctions every 5 minutes
   * Publishes auction save and result announcement tasks to RabbitMQ
   */
  @Cron('*/5 * * * *') // every 5 minutes
  async auctionCron() {
    this.logger.log("Publishing auction processing tasks to RabbitMQ...");

    try {
      // Publish auction save task to RabbitMQ
      await this.publishAuctionSaveTask();
      
      // Publish auction result announcement task to RabbitMQ
      await this.publishAuctionResultAnnouncementTask();
    
    } catch (error) {
      this.logger.error("Error publishing auction tasks to RabbitMQ:", error);
    }
  }

  /**
   * Publish auction save task to RabbitMQ (simple trigger message)
   */
  async publishAuctionSaveTask(): Promise<void> {
    try {
      // Simple trigger message without any data
      const triggerMessage = {
        timestamp: new Date().toISOString(),
        trigger: 'SAVE_ACTIVE_AUCTIONS'
      };

      const published = await this.rabbitMQService.publishAuctionSave(triggerMessage);
      if (published) {
        this.logger.log('Published auction save trigger to RabbitMQ');
      } else {
        this.logger.error('Failed to publish auction save trigger to RabbitMQ');
      }
    } catch (error) {
      this.logger.error('Error publishing auction save trigger:', error);
    }
  }

  /**
   * Publish auction result announcement task to RabbitMQ (simple trigger message)
   */
  async publishAuctionResultAnnouncementTask(): Promise<void> {
    try {
      // Simple trigger message without any data
      const triggerMessage = {
        timestamp: new Date().toISOString(),
        trigger: 'ANNOUNCE_AUCTION_RESULTS'
      };

      const published = await this.rabbitMQService.publishAuctionAnnounceResults(triggerMessage);
      if (published) {
        this.logger.log('Published auction result announcement trigger to RabbitMQ');
      } else {
        this.logger.error('Failed to publish auction result announcement trigger to RabbitMQ');
      }
    } catch (error) {
      this.logger.error('Error publishing auction result announcement trigger:', error);
    }
  }

  // ========== ORIGINAL METHODS (for reference/backup) ==========
  // async saveActiveAuctionsToRedis() {
  //   this.logger.log("Saving active auctions to Redis...");
  //   try {
  //     const currentTime = new Date();

  //     // Find all auctions where startTime has passed but endTime hasn't
  //     const activeAuctions = await this.auctionModel
  //       .find({
  //         startTime: { $lte: currentTime },
  //         status: { $eq: AUCTION_STATUS.ACTIVE },
  //       })
  //       .exec();
  //     for (const auction of activeAuctions) {
  //       const redisKey = `activeAuction:${auction._id}`;
  //       const auctionData = {
  //         _id: auction._id,
  //         title: auction.title,
  //         startTime: auction.startTime,
  //         endTime: auction.endTime,
  //         status: AUCTION_STATUS.ACTIVE,
  //         startingBid: auction.startingBid,
  //         currentHighestBid: auction.currentHighestBid,
  //         participantsCount: auction.participants?.length || 0,
  //         allParticipantsCount: auction.allParticipants?.length || 0,
  //         lastUpdated: new Date().toISOString(),
  //       };

  //       await this.redisService.set(redisKey, auctionData);

  //       await this.auctionModel.findByIdAndUpdate(auction._id, {
  //         status: AUCTION_STATUS.ACTIVE,
  //       });
  //     }
  //   } catch (error) {
  //     this.logger.error("Error saving active auctions to Redis:", error);
  //   }
  // }

  // async triggerAuctionResultAnnouncement() {
  //   this.logger.log("Triggering auction result announcement...");
  //   try {
  //     const allAuctionsRedisKeys = await this.redisService.keys("activeAuction:*");
  //     for (const auctionKey of allAuctionsRedisKeys) {
  //       const auctionData = await this.redisService.get(auctionKey);
  //       const endTime = new Date(auctionData.endTime);
  //       if (endTime <= new Date()) {
  //         this.logger.log(`Auction ${auctionData._id} has ended`);
  //         const highestBid = await this.bidsModel.findOne({ auctionId: auctionData._id }).sort({ bidAmount: -1 }).exec();
  //         if (highestBid) {
  //           const winner = await this.userModel.findById(highestBid.userId).exec();
  //           await this.auctionModel.findByIdAndUpdate(auctionData._id, { status: "completed", winnerId: winner?._id , bidId: highestBid?._id});
  //           await this.redisService.del(auctionKey);
  //           this.roomEmitter.emitGlobalNotification(`${winner?.name} has won the auction: ${auctionData.title}`);
  //           this.roomEmitter.emitGlobalAuctionEnded(`${auctionData.title} has ended`);
  //         } else {
  //           await this.auctionModel.findByIdAndUpdate(auctionData._id, { status: "completed" });
  //           await this.redisService.del(auctionKey);
  //           this.roomEmitter.emitGlobalAuctionEnded(`${auctionData.title} has ended`);
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     this.logger.error("Error triggering auction result announcement:", error);
  //   }
  // }
}
