import { UserRole } from '../../constants/role';
import { IsArray, IsEmail, IsEnum, IsPhoneNumber, IsString } from 'class-validator';

export class RegisterDto {
    @IsString()
    password: string;

    @IsEmail()
    email: string;

    @IsString()
    name: string;

    @IsPhoneNumber()
    phone_number: string;

    @IsArray()
    @IsEnum(UserRole, { each: true })
    role: UserRole[];
}