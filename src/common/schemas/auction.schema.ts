import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type AuctionDocument = Auction & Document;

@Schema({ timestamps: true })
export class Auction {
  @Prop({ default: null })
  carId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  startingBid: number;

  @Prop({ default: 0 })
  currentHighestBid: number;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  winnerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Bid", default: null })
  bidId: Types.ObjectId;

  @Prop({ enum: ["active", "inactive", "completed"], default: "inactive" })
  status: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
  participants: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
  allParticipants: Types.ObjectId[];
}

export const AuctionSchema = SchemaFactory.createForClass(Auction);
