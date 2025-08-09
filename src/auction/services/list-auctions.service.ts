import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Auction, AuctionDocument } from "src/common/schemas/auction.schema";
import { AuctionHelperService } from "./auction-helper.service";
import { ListAuctionsDto, AuctionListResponseDto } from "../dto";
import { ResponseFormatter } from "src/common/helper/response-formatter.helper";

@Injectable()
export class ListAuctionsService {
  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<AuctionDocument>,
    private auctionHelperService: AuctionHelperService
  ) {}

  async listAuctions(listAuctionsDto: ListAuctionsDto) {
    const { page = 1, limit = 10, status, search } = listAuctionsDto;

    // Build query
    const query: any = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Search in title if provided
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const auctions = await this.auctionModel
      .find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await this.auctionModel.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Construct response data with proper structure
    const responseData = {
      auctions: auctions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };

    return ResponseFormatter.success(
      responseData,
      "Auctions fetched successfully"
    );
  }
}
