import { IsString, IsNumber, IsDateString, IsOptional, IsArray } from 'class-validator';

export class AuctionResponseDto {
  @IsString()
  _id: string;

  @IsOptional()
  @IsString()
  carId?: string;

  @IsString()
  title: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsNumber()
  startingBid: number;

  @IsNumber()
  currentHighestBid: number;

  @IsOptional()
  @IsString()
  winnerId?: string;

  @IsOptional()
  @IsString()
  bidId?: string;

  @IsString()
  status: string;

  @IsArray()
  participants: string[];

  @IsArray()
  allParticipants: string[];
}
