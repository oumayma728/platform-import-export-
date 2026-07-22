import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Updated user email address.',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Updated user full name.',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '+21612345678',
    description: 'Updated user phone number in international format.',
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({
    example: 'newPassword123',
    description: 'Updated user password.',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    enum: ValidationStatus,
    example: ValidationStatus.VALIDE,
    description: 'Updated validation status for the user.',
  })
  @IsOptional()
  @IsEnum(ValidationStatus)
  status?: ValidationStatus;
}
