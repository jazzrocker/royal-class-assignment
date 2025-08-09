import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, Min, IsEnum } from 'class-validator';

export class CreateAuctionDto {
  @IsOptional()
  @IsString()
  carId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsNumber()
  @Min(0)
  startingBid: number;
}
