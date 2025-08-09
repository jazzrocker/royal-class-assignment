import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BidsDocument = Bids & Document;

@Schema({ timestamps: true })
export class Bids {
  @Prop({ required: true })
  bidAmount: number;

  @Prop({ type: Boolean, default: false })
  win: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Auction', required: true })
  auctionId: Types.ObjectId;
}

export const BidsSchema = SchemaFactory.createForClass(Bids);
