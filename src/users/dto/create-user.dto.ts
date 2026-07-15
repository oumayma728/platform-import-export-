import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
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

  // @ApiProperty({
  //   example: 'MEMBER',
  //   description: 'User role in the system. Default is MEMBER. Possible values: ADMIN, MEMBER. Only Admin users can create other Admin users.',
  // })
  // @IsString()
  // role!: string;
}
