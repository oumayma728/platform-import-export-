import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name.',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: '+21612345678',
    description: 'User phone number in international format.',
  })
  @IsPhoneNumber()
  phone!: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password.',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
