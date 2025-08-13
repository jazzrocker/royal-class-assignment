import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auction } from '../../common/schemas/auction.schema';
import { Bids } from '../../common/schemas/bids.schema';
import { User } from '../../common/schemas/user.schema';
import { RedisService } from '../../common/redis/redis.service';
import { RoomEmitter } from '../../websocket/emitters/room.emitter';
import { RabbitMQService } from '../../common/rabbitmq/rabbitmq.service';
import { RABBITMQ_CONFIG } from '../../common/rabbitmq/rabbitmq.config';

@Injectable()
export class TriggerAuctionResultsService implements OnModuleInit {
  private readonly logger = new Logger(TriggerAuctionResultsService.name);

  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<Auction>,
    @InjectModel(Bids.name) private bidsModel: Model<Bids>,
    @InjectModel(User.name) private userModel: Model<User>,
    private redisService: RedisService,
    private roomEmitter: RoomEmitter,
    private rabbitMQService: RabbitMQService
  ) {}

  async onModuleInit() {
    // Subscribe to the auctions.announce.results queue
    await this.subscribeToAuctionResultMessages();
  }

  private async subscribeToAuctionResultMessages(): Promise<void> {
    try {
      if (this.rabbitMQService.getConnectionStatus()) {
        await this.rabbitMQService.subscribe(
          RABBITMQ_CONFIG.queues.announceResults.name,
          this.processAuctionResultMessage.bind(this)
        );
        this.logger.log('Successfully subscribed to auctions.announce.results queue');
      } else {
        this.logger.warn('RabbitMQ not connected. Skipping subscription to auctions.announce.results queue');
      }
    } catch (error) {
      this.logger.error('Failed to subscribe to auctions.announce.results queue:', error.message);
    }
  }

  private async processAuctionResultMessage(message: any): Promise<void> {
    this.logger.log('Processing auction result announcement trigger message', message.trigger);
    
    try {
      if (message.trigger === 'ANNOUNCE_AUCTION_RESULTS') {
        // Fetch and process all ended auctions
        await this.triggerAuctionResultAnnouncement();
      } else {
        this.logger.warn('Unknown trigger received:', message.trigger);
      }
    } catch (error) {
      this.logger.error('Error processing auction result message:', error);
      throw error; // Re-throw to handle message nack
    }
  }

  async triggerAuctionResultAnnouncement(): Promise<void> {
    this.logger.log("Triggering auction result announcement...");
    
    try {
      const allAuctionsRedisKeys = await this.redisService.keys("activeAuction:*");
      
      this.logger.log(`Found ${allAuctionsRedisKeys.length} active auctions in Redis to check`);

      for (const auctionKey of allAuctionsRedisKeys) {
        const auctionData = await this.redisService.get(auctionKey);
        const endTime = new Date(auctionData.endTime);
        console.log(endTime,endTime <= new Date());
        if (endTime <= new Date()) {
          this.logger.log(`Auction ${auctionData._id} has ended`);
          
          // Find the highest bid for this auction
          const highestBid = await this.bidsModel
            .findOne({ auctionId: auctionData._id })
            .sort({ bidAmount: -1 })
            .exec();

          if (highestBid) {
            // Get winner details
            const winner = await this.userModel.findById(highestBid.userId).exec();
            
            // Update auction with winner information
            await this.auctionModel.findByIdAndUpdate(auctionData._id, {
              status: "completed",
              winnerId: winner?._id,
              bidId: highestBid?._id
            });

            // Remove from Redis cache
            await this.redisService.del(auctionKey);

            // Emit notifications
            this.roomEmitter.emitGlobalNotification(
              `${winner?.name} has won the auction: ${auctionData.title}`
            );
            this.roomEmitter.emitGlobalAuctionEnded(
              `${auctionData.title} has ended`
            );

            this.logger.log(
              `Auction ${auctionData._id} completed. Winner: ${winner?.name} (${winner?._id})`
            );
          } else {
            // No bids for this auction
            await this.auctionModel.findByIdAndUpdate(auctionData._id, {
              status: "completed"
            });

            // Remove from Redis cache
            await this.redisService.del(auctionKey);

            // Emit notification
            this.roomEmitter.emitGlobalAuctionEnded(
              `${auctionData.title} has ended`
            );

            this.logger.log(
              `Auction ${auctionData._id} completed with no bids`
            );
          }
        }
      }

      this.logger.log("Successfully processed auction results");
    } catch (error) {
      this.logger.error('Error triggering auction result announcement:', error);
      throw error;
    }
  }


}