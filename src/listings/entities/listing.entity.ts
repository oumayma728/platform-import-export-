import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus, ListingType } from '@prisma/client';

import { CompanyEntity } from '../../companies/entities/company.entity';


/**
 * This File Exists Only To Add Clarity In Type Of Response In Swagger Docs
 */
export class ListingEntity {
  @ApiProperty({ example: '3203f19e-e763-426b-9c24-b14316d84878' })
  id!: string;

  @ApiProperty({ example: '3203f19e-e763-426b-9c24-b14316d84879' })
  companyId!: string;

  @ApiProperty({ enum: ListingType, example: ListingType.OFFRE })
  type!: ListingType;

  @ApiProperty({ example: 'Copper wire' })
  title!: string;

  @ApiProperty({ example: 'Metals' })
  category!: string;

  @ApiProperty({
    example: '1200.00',
    description:
      'Listing price. Prisma Decimal values are typically serialized as strings in JSON responses.',
  })
  price!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiPropertyOptional({
    example: '1230.00',
    nullable: true,
    description:
      'USD price. Prisma Decimal values are typically serialized as strings in JSON responses.',
  })
  priceUsd!: string | null;

  @ApiProperty({
    example: '50.00',
    description:
      'Available quantity. Prisma Decimal values are typically serialized as strings in JSON responses.',
  })
  quantity!: string;

  @ApiProperty({ example: 'kg' })
  unit!: string;

  @ApiProperty({ example: 'Tunisia' })
  country!: string;

  @ApiProperty({ example: 'FOB' })
  incoterm!: string;

  @ApiPropertyOptional({
    example: '2026-08-01T00:00:00.000Z',
    nullable: true,
    format: 'date-time',
  })
  deadline!: string | null;

  @ApiProperty({ enum: ListingStatus, example: ListingStatus.ACTIVE })
  status!: ListingStatus;

  @ApiProperty({ type: () => CompanyEntity })
  company!: CompanyEntity;

  @ApiProperty({
    example: '2026-07-15T10:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-07-15T10:30:00.000Z',
    format: 'date-time',
  })
  updatedAt!: string;
}
