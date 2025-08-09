import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Auction, AuctionDocument } from "src/common/schemas/auction.schema";
import { Bids } from "src/common/schemas/bids.schema";
import { AuctionHelperService } from "./auction-helper.service";
import { RESPONSE_CONSTANTS } from "src/common/constants/response.constants";
import { ServiceError } from "src/common/errors/service.error";

@Injectable()
export class JoinAuctionService {
  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<AuctionDocument>,
    @InjectModel(Bids.name) private bidsModel: Model<Bids>,
    private auctionHelperService: AuctionHelperService
  ) {}

  async joinAuction(auctionId: string, userId: string) {
    // Validate auction ID format
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new ServiceError(RESPONSE_CONSTANTS.INVALID_AUCTION_ID);
    }

    // Find the auction
    const auction =
      await this.auctionHelperService.getAuctionDetails(auctionId);

    if (!auction) {
      throw new ServiceError(RESPONSE_CONSTANTS.AUCTION_NOT_FOUND);
    }

    // Check if auction is active
    if (auction.status !== "active") {
      throw new ServiceError(RESPONSE_CONSTANTS.AUCTION_NOT_ACTIVE);
    }

    // Check if auction has started
    const now = new Date();
    if (auction.startTime > now) {
      throw new ServiceError(RESPONSE_CONSTANTS.AUCTION_NOT_STARTED);
    }

    // Check if auction has ended
    if (auction.endTime < now) {
      throw new ServiceError(RESPONSE_CONSTANTS.AUCTION_ENDED);
    }

    // Add user to participants
    await this.auctionModel.findByIdAndUpdate(auctionId, {
      $addToSet: {
        participants: new Types.ObjectId(userId),
        allParticipants: new Types.ObjectId(userId),
      },
    });

    // Get bids for the auction
    const bids = await this.bidsModel
      .find({ auctionId })
      .populate("userId", "name username")
      .sort({ bidAmount: -1 })
      .exec();

    const modifiedBids = bids.map(bid => ({
      _id: bid._id,
      name: (bid as any).userId?.name || null,
      username: (bid as any).userId?.username || null,
      bidAmount: bid.bidAmount,
      createdAt: (bid as any).createdAt,
    }));

    auction.bids = modifiedBids;

    // Return auction data for WebSocket room
    return auction;
  }

  async leaveAuction(auctionId: string, userId: string) {
    // Validate auction ID format
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new ServiceError(RESPONSE_CONSTANTS.INVALID_AUCTION_ID);
    }

    // Find the auction
    const auction = await this.auctionModel.findById(auctionId).lean();

    if (!auction) {
      throw new ServiceError(RESPONSE_CONSTANTS.AUCTION_NOT_FOUND);
    }

    // Check if user is a participant
    const isParticipant = auction.participants.some(
      (participantId: any) => participantId.toString() === userId
    );

    if (!isParticipant) {
      throw new ServiceError(RESPONSE_CONSTANTS.NOT_JOINED_AUCTION);
    }

    // Remove user from participants
    await this.auctionModel.findByIdAndUpdate(auctionId, {
      $pull: {
        participants: new Types.ObjectId(userId),
      },
    });

    return {
      auctionId: auction._id.toString(),
      message: "Successfully left auction room",
    };
  }

  async getAuctionStatus(auctionId: string) {
    // Validate auction ID format
    if (!Types.ObjectId.isValid(auctionId)) {
      throw new ServiceError(RESPONSE_CONSTANTS.INVALID_AUCTION_ID);
    }

    // Find the auction
    const auction = await this.auctionModel.findById(auctionId).lean();

    if (!auction) {
      throw new ServiceError(RESPONSE_CONSTANTS.AUCTION_NOT_FOUND);
    }

    return {
      auctionId: auction._id.toString(),
      status: auction.status,
      currentHighestBid: auction.currentHighestBid,
      participants: auction.participants.length,
      startTime: auction.startTime,
      endTime: auction.endTime,
      isActive:
        auction.status === "active" &&
        auction.startTime <= new Date() &&
        auction.endTime > new Date(),
    };
  }
}
