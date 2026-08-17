import { ApiProperty } from '@nestjs/swagger';
import { ListingStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateListingStatusDto {
  @ApiProperty({
    enum: ListingStatus,
    example: ListingStatus.CLOTUREE,
    description: 'New lifecycle status for the listing.',
  })
  @IsEnum(ListingStatus)
  status!: ListingStatus;
}
