import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class EstimateLogisticsDto {
  @ApiProperty({
    example: 'Tunisia',
    description: 'Origin country name or ISO country code.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  from!: string;

  @ApiProperty({
    example: 'France',
    description: 'Destination country name or ISO country code.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  to!: string;
}
