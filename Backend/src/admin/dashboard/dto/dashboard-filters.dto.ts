import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters shared by both GET /admin/users and GET /admin/companies.
 *
 * All fields are optional — only present filters are applied.
 */
export class DashboardFiltersDto {
  @ApiPropertyOptional({
    enum: ValidationStatus,
    example: ValidationStatus.EN_ATTENTE_VALIDATION,
    description:
      'Filter by validation status. ' +
      'For /admin/companies, filters through the users relation. ' +
      'For /admin/users, filters the user.status field directly.',
  })
  @IsOptional()
  @IsEnum(ValidationStatus)
  status?: ValidationStatus;

  @ApiPropertyOptional({
    example: 'Tunisia',
    description:
      'Filter by country. ' +
      'For /admin/users this filters via company.country.',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: 'Agroalimentaire',
    description:
      'Filter by business sector. ' +
      'For /admin/users this filters via company.sector.',
  })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description:
      'ISO 8601 date string — include records created on or after this date.',
  })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description:
      'ISO 8601 date string — include records created on or before this date.',
  })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (1-indexed). Defaults to 1.',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of records per page. Defaults to 10.',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
