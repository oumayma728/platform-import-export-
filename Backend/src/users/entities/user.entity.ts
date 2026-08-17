import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, ValidationStatus } from '@prisma/client';

/**
 * This File Exists Only To Add Clarity In Type Of Response In Swagger Docs
 */
export class UserEntity {
  @ApiProperty({ example: '3203f19e-e763-426b-9c24-b14316d84878' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: '+21612345678' })
  phone!: string;

  @ApiProperty({
    enum: ValidationStatus,
    example: ValidationStatus.EN_ATTENTE_VALIDATION,
    description: 'Current account validation status.',
  })
  status!: ValidationStatus;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.MEMBRE,
    description: 'Current user role.',
  })
  role!: UserRole;

  @ApiPropertyOptional({
    example: '3203f19e-e763-426b-9c24-b14316d84879',
    nullable: true,
    description:
      'Related company identifier when the user belongs to a company.',
  })
  companyId!: string | null;

  @ApiProperty({
    example: '2026-07-15T10:00:00.000Z',
    format: 'date-time',
  })
  createdAt!: string;

  @ApiProperty({
    example: '2026-07-15T10:30:00.000Z',
    format: 'date-time',
  })
  updatedAt!: string;
}
