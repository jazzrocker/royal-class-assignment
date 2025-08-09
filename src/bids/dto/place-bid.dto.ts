import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class PlaceBidDto {
  @IsNotEmpty()
  @IsString()
  auctionId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  bidAmount: number;

  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class PlaceBidResponseDto {
  _id: string;
  bidAmount: number;
  userId: string;
  auctionId: string;
  createdAt: Date;
  username: string;
  name: string;
}
