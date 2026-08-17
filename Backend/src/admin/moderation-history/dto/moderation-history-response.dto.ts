import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModerationActionType, ModerationEntityType } from '@prisma/client';

export class ModerationHistoryResponseDto {
  @ApiProperty({ example: 'clx1234abcd' })
  id!: string;

  @ApiProperty({
    enum: ModerationEntityType,
    example: ModerationEntityType.COMPANY,
    description: 'Type of the entity that was moderated.',
  })
  entityType!: ModerationEntityType;

  @ApiProperty({
    example: '3203f19e-e763-426b-9c24-b14316d84878',
    description: 'UUID of the moderated entity (company or user).',
  })
  entityId!: string;

  @ApiProperty({
    enum: ModerationActionType,
    example: ModerationActionType.VALIDATION,
    description:
      'Action performed: VALIDATION | REJECTION | SUSPENSION | KYB_VERIFICATION | BADGE_ASSIGNED.',
  })
  actionType!: ModerationActionType;

  @ApiProperty({
    example: 'admin-uuid-1234',
    description: 'ID of the administrator who performed the action.',
  })
  adminId!: string;

  @ApiPropertyOptional({
    example: { motif: 'Documents conformes' },
    description: 'JSON object with action-specific details (motif, kybScore, badgeType, etc.).',
    nullable: true,
  })
  details!: unknown | null;

  @ApiProperty({
    example: '2026-08-08T16:58:00.000Z',
    format: 'date-time',
    description: 'Timestamp when the moderation action was recorded.',
  })
  timestamp!: Date;
}

export class ModerationHistoryListResponseDto {
  @ApiProperty({ type: [ModerationHistoryResponseDto] })
  data!: ModerationHistoryResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({
    example: 42,
    description: 'Total number of moderation history records matching the filters.',
  })
  total!: number;
}
