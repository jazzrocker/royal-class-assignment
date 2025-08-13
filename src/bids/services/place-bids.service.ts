import {
  Injectable,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Bids } from "../../common/schemas/bids.schema";
import { Auction } from "../../common/schemas/auction.schema";
import { PlaceBidDto, PlaceBidResponseDto } from "../dto/place-bid.dto";
import { AuctionHelperService } from "src/auction/services/auction-helper.service";
import { ServiceError } from "src/common/errors/service.error";
import { RESPONSE_CONSTANTS } from "src/common/constants/response.constants";
import { User } from "src/common/schemas/user.schema";
import { RoomEmitter } from "src/websocket/emitters/room.emitter";
import { ResponseFormatter } from "src/common/helper/response-formatter.helper";

@Injectable()
export class PlaceBidsService {
  private readonly logger = new Logger(PlaceBidsService.name);

  constructor(
    @InjectModel(Bids.name) private bidsModel: Model<Bids>,
    @InjectModel(Auction.name) private auctionModel: Model<Auction>,
    @InjectModel(User.name) private userModel: Model<User>,
    private auctionHelperService: AuctionHelperService,
    private roomEmitter: RoomEmitter
  ) {}

  async placeBid(placeBidDto: PlaceBidDto): Promise<PlaceBidResponseDto> {
    const { auctionId, bidAmount, userId } = placeBidDto;

    try {
      // Find the auction
      const auction =
        await this.auctionHelperService.getAuctionDetails(auctionId);
      if (!auction) {
        throw new ServiceError(RESPONSE_CONSTANTS.AUCTION_NOT_FOUND);
      }

      // Check if auction is active
      const currentTime = new Date();
      if (currentTime < auction.startTime) {
        this.roomEmitter.emitUserNotification(
          "Auction not started yet.",
          userId
        );
        throw new ServiceError(RESPONSE_CONSTANTS.AUCTION_NOT_STARTED);
      }

      if (currentTime > auction.endTime) {
        this.roomEmitter.emitUserNotification("Auction ended.", userId);
        throw new ServiceError(RESPONSE_CONSTANTS.AUCTION_ENDED);
      }

      if (auction.status !== "active") {
        this.roomEmitter.emitUserNotification("Auction not active.", userId);
        throw new ServiceError(RESPONSE_CONSTANTS.AUCTION_NOT_ACTIVE);
      }

      // Check if bid amount is higher than current highest bid
      if (bidAmount <= auction.currentHighestBid) {
        this.roomEmitter.emitUserNotification(
          "Bid amount must be higher than current highest bid.",
          userId
        );
        throw new ServiceError(
          RESPONSE_CONSTANTS.BID_AMOUNT_MUST_BE_HIGHER_THAN_CURRENT_HIGHEST_BID
        );
      }

      // Create the bid
      const newBid = new this.bidsModel({
        bidAmount,
        userId,
        auctionId,
      });

      const savedBid = await newBid.save();

      // Update auction with new highest bid
      await this.auctionModel.findByIdAndUpdate(auctionId, {
        currentHighestBid: bidAmount,
      });

      this.logger.log(
        `Bid placed successfully: ${savedBid._id} for auction ${auctionId} by user ${userId}`
      );
      const user = await this.userModel.findById(userId);
      const username = user?.username || "";
      const name = user?.name || "";

      // Return the response DTO
      return {
        _id: savedBid._id.toString(),
        bidAmount: savedBid.bidAmount,
        userId: savedBid.userId.toString(),
        auctionId: savedBid.auctionId.toString(),
        createdAt: (savedBid as any).createdAt,
        username,
        name,
      };
    } catch (error) {
      this.logger.error(`Error placing bid: ${error.message}`);
      throw error;
    }
  }

  async getBidsByAuction(auctionId: string): Promise<Bids[]> {
    try {
      return await this.bidsModel
        .find({ auctionId })
        .populate("userId", "email username")
        .sort({ bidAmount: -1 })
        .exec();
    } catch (error) {
      this.logger.error(
        `Error getting bids for auction ${auctionId}: ${error.message}`
      );
      throw error;
    }
  }

  async getBidsByUser(userId: string) {
    try {
      const bids = await this.bidsModel
        .find({ userId })
        .populate("auctionId", "title")
        .sort({ createdAt: -1 })
        .exec();

      const response = bids.map((bid) => {
        return {
          _id: bid._id.toString(),
          bidAmount: bid.bidAmount,
          auctionId: bid.auctionId._id.toString(),
          auctionTitle: (bid.auctionId as any).title,
          createdAt: (bid as any).createdAt,
        };
      });
      return ResponseFormatter.success(response, "Bids fetched successfully");
    } catch (error) {
      this.logger.error(
        `Error getting bids for user ${userId}: ${error.message}`
      );
      throw error;
    }
  }
}
