import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class GetCompaniesFilterDto {
  @ApiPropertyOptional({
    enum: ValidationStatus,
    description:
      'Filter companies by validation status (e.g. EN_ATTENTE_VALIDATION, VALIDE, REJETE, SUSPENDU). Defaults to EN_ATTENTE_VALIDATION.',
    example: ValidationStatus.EN_ATTENTE_VALIDATION,
  })
  @IsOptional()
  @IsEnum(ValidationStatus)
  status?: ValidationStatus;
}
