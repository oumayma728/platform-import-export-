import { IsEmail, IsString, IsArray, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  phoneNumber: string;

  @IsArray()
  @IsOptional()
  role?: string[];

  @IsString()
  passwordHash: string;
}

