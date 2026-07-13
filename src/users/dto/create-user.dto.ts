import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsPhoneNumber } from 'class-validator';
import { ValidationStatus } from '@prisma/client';
  // TODO maybe we will add company id

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '+21612345678', description: 'Phone number' })
  @IsString()
  @IsPhoneNumber()
  phone!: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsEnum(ValidationStatus)
  status?: string;
}
