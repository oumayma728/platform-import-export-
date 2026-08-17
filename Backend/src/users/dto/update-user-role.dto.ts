import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.ADMIN,
    description: 'New user role. Admin-only operation.',
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
