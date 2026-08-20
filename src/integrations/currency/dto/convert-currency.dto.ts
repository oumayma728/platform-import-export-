import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ConvertCurrencyDto {
  @ApiProperty({
    example: 100,
    description: 'Amount to convert.',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({
    example: 'EUR',
    description: 'Source currency code (ISO 4217).',
  })
  @IsString()
  @IsNotEmpty()
  from!: string;

  @ApiProperty({
    example: 'USD',
    description: 'Target currency code (ISO 4217).',
  })
  @IsString()
  @IsNotEmpty()
  to!: string;
}
