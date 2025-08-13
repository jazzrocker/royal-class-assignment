import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auction } from '../../common/schemas/auction.schema';
import { RedisService } from '../../common/redis/redis.service';
import { AUCTION_STATUS } from '../../common/constants/auction.constants';
import { RabbitMQService } from '../../common/rabbitmq/rabbitmq.service';
import { RABBITMQ_CONFIG } from '../../common/rabbitmq/rabbitmq.config';

@Injectable()
export class SaveActiveAuctionsService implements OnModuleInit {
  private readonly logger = new Logger(SaveActiveAuctionsService.name);

  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<Auction>,
    private redisService: RedisService,
    private rabbitMQService: RabbitMQService
  ) {}

  async onModuleInit() {
    // Subscribe to the auctions.save queue
    await this.subscribeToAuctionSaveMessages();
  }

  private async subscribeToAuctionSaveMessages(): Promise<void> {
    try {
      if (this.rabbitMQService.getConnectionStatus()) {
        await this.rabbitMQService.subscribe(
          RABBITMQ_CONFIG.queues.saveActiveAuctions.name,
          this.processAuctionSaveMessage.bind(this)
        );
        this.logger.log('Successfully subscribed to auctions.save queue');
      } else {
        this.logger.warn('RabbitMQ not connected. Skipping subscription to auctions.save queue');
      }
    } catch (error) {
      this.logger.error('Failed to subscribe to auctions.save queue:', error.message);
    }
  }

  private async processAuctionSaveMessage(message: any): Promise<void> {
    this.logger.log('Processing auction save trigger message', message.trigger);
    
    try {
      if (message.trigger === 'SAVE_ACTIVE_AUCTIONS') {
        // Fetch and process all active auctions
        await this.saveActiveAuctionsToRedis();
      } else {
        this.logger.warn('Unknown trigger received:', message.trigger);
      }
    } catch (error) {
      this.logger.error('Error processing auction save message:', error);
      throw error; // Re-throw to handle message nack
    }
  }

  async saveActiveAuctionsToRedis(): Promise<void> {
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

      this.logger.log(`Found ${activeAuctions.length} active auctions to process`);

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

        // Save to Redis
        await this.redisService.set(redisKey, auctionData);

        // Update auction status in database
        await this.auctionModel.findByIdAndUpdate(auction._id, {
          status: AUCTION_STATUS.ACTIVE,
        });

        this.logger.log(`Saved auction ${auction._id} to Redis and updated status`);
      }
      
      this.logger.log(`Successfully processed ${activeAuctions.length} active auctions`);
    } catch (error) {
      this.logger.error('Error saving active auctions to Redis:', error);
      throw error;
    }
  }


}