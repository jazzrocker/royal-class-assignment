import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { RESPONSE_CONSTANTS } from "src/common/constants/response.constants";
import { ServiceError } from "src/common/errors/service.error";
import { ResponseFormatter } from "src/common/helper/response-formatter.helper";
import { User, UserDocument } from "src/common/schemas";
import { Auction, AuctionDocument } from "src/common/schemas";

@Injectable()
export class UserDataService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Auction.name) private auctionModel: Model<AuctionDocument>
    ) {}

    async getUserData(userId: string) {
        const user = await this.userModel.findById(userId).lean();
    
        if (!user) {
          throw new ServiceError(RESPONSE_CONSTANTS.USER_NOT_FOUND);
        }
        const auctions = await this.auctionModel
          .find({ participants: userId })
          .select("_id ")
          .lean();
    
          return ResponseFormatter.success(
            {
              _id: user?._id,
              username: user.username,
              name: user.name,
              email: user.email,
              activeAuctions: auctions.map((auction) => auction._id),
            },
            "User data fetched successfully"
          );

      }
}