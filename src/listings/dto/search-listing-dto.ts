import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus, ListingType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchListingsDto {
  @ApiPropertyOptional({
    example: 'Tunisia',
    description: 'Filter by listing country.',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: 'Metals',
    description: 'Filter by product category.',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    enum: ListingType,
    example: ListingType.OFFRE,
    description: 'Filter by listing type.',
  })
  @IsOptional()
  @IsEnum(ListingType)
  type?: ListingType;

  @ApiPropertyOptional({
    enum: ListingStatus,
    example: ListingStatus.ACTIF,
    description: 'Filter by listing status.',
  })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({
    example: 100,
    description: 'Minimum price filter.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({
    example: 500,
    description: 'Maximum price filter.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({
    example: 'ISO 9001',
    description: 'Certification keyword filter applied against company data.',
  })
  @IsOptional()
  @IsString()
  certification?: string;

  @ApiPropertyOptional({
    example: 'Copper wire',
    description: 'Free-text search across selected listing fields.',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    example: 'EUR',
    description:
      'Target currency code (ISO 4217). When provided, each listing will include convertedPrice and convertedCurrency fields.',
  })
  @IsOptional()
  @IsString()
  convertTo?: string;
}
