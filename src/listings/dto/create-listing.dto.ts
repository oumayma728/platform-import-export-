import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateListingDto {
  @ApiProperty({
    example: '3203f19e-e763-426b-9c24-b14316d84879',
    description: 'Identifier of the company that owns the listing.',
  })
  @IsString()
  @IsNotEmpty()
  companyId!: string;

  @ApiProperty({
    enum: ListingType,
    example: ListingType.OFFRE,
    description: 'Listing type.',
  })
  @IsEnum(ListingType)
  type!: ListingType;

  @ApiProperty({
    example: 'Copper wire',
    description: 'Listing title.',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: 'Metals',
    description: 'Listing category.',
  })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({
    example: 1200,
    description: 'Price value sent by the client.',
  })
  @IsNumber()
  price!: number;

  @ApiProperty({
    example: 'USD',
    description: 'ISO-like currency code used for the price.',
  })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiPropertyOptional({
    example: 1230,
    description: 'Optional USD-converted price.',
  })
  @IsOptional()
  @IsNumber()
  priceUsd?: number;

  @ApiProperty({
    example: 50,
    description: 'Available quantity.',
  })
  @IsNumber()
  quantity!: number;

  @ApiProperty({
    example: 'kg',
    description: 'Unit of measure.',
  })
  @IsString()
  @IsNotEmpty()
  unit!: string;

  @ApiProperty({
    example: 'Tunisia',
    description: 'Country of origin or availability.',
  })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({
    example: 'FOB',
    description: 'Applicable Incoterm.',
  })
  @IsString()
  @IsNotEmpty()
  incoterm!: string;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Optional deadline as an ISO date string.',
  })
  @IsOptional()
  @IsDateString()
  deadline!: string;
}
