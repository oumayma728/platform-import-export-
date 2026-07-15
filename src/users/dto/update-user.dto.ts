import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { ValidationStatus } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({
    enum: ValidationStatus,
    example: ValidationStatus.VALIDE,
    description: 'Updated validation status for the user.',
  })
  @IsOptional()
  @IsEnum(ValidationStatus)
  status?: ValidationStatus;
}
