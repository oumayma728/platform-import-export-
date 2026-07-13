import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus, ListingType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchListingsDto {
  @ApiPropertyOptional({ example: 'Tunisia' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Metals' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'OFFRE' })
  @IsOptional()
  @IsEnum(ListingType)
  type?: ListingType;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'ISO 9001' })
  @IsOptional()
  @IsString()
  certification?: string;

  @ApiPropertyOptional({ example: 'Copper wire' })
  @IsOptional()
  @IsString()
  q?: string;
}
