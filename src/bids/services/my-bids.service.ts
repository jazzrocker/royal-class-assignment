import { Injectable, Logger } from "@nestjs/common";
import { ResponseFormatter } from "src/common/helper/response-formatter.helper";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Bids } from "src/common/schemas/bids.schema";

@Injectable()
export class MyBidsService {
  private readonly logger = new Logger(MyBidsService.name);

  constructor(@InjectModel(Bids.name) private bidsModel: Model<Bids>) {}

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
