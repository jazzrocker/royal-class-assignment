import { IsArray, IsNumber, IsBoolean } from 'class-validator';
import { AuctionResponseDto } from './auction-response.dto';

export class PaginationDto {
  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;

  @IsNumber()
  total: number;

  @IsNumber()
  totalPages: number;

  @IsBoolean()
  hasNext: boolean;

  @IsBoolean()
  hasPrev: boolean;
}

export class AuctionListResponseDto {
  @IsArray()
  auctions: AuctionResponseDto[];

  pagination: PaginationDto;
}
