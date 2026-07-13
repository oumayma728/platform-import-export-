import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus, ListingType } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateListingDto {
  @ApiProperty({ example: 'clm123example' })
  @IsString()
  companyId!: string;

  @ApiProperty({ enum: ListingType, example: ListingType.OFFRE })
  @IsEnum(ListingType)
  type!: ListingType;

  @ApiProperty({ example: 'Copper wire' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Metals' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  price!: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  currency!: string;

  @ApiPropertyOptional({ example: 1230 })
  @IsOptional()
  @IsNumber()
  priceUsd?: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  quantity!: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit!: string;

  @ApiProperty({ example: 'Tunisia' })
  @IsString()
  country!: string;

  @ApiProperty({ example: 'FOB' })
  @IsString()
  incoterm!: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsDateString()
  deadline!: string;

  @ApiPropertyOptional({ enum: ListingStatus, example: ListingStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}
