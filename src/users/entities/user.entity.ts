import { ApiProperty } from '@nestjs/swagger';

export enum ValidationStatus {
  EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE',
  SUSPENDU = 'SUSPENDU',
}

export class UserEntity {
  @ApiProperty({ example: '3203f19e-e763-426b-9c24-b14316d84878' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: '+21612345678' })
  phone: string;

  @ApiProperty({ example: 'jhgsjgdiLQFOAZFKscqsvze' })
  hashedPassword: string;

  @ApiProperty({ example: 'EN_ATTENTE_VALIDATION', enum: ValidationStatus })
  status: string;

  @ApiProperty({ example: 'company-uuid', required: false, nullable: true })
  companyId: string | null;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
