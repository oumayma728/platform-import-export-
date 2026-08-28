import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

export class GetNotificationLogsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter logs by user ID',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    enum: NotificationChannel,
    description: 'Filter logs by channel (EMAIL, SMS)',
  })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional({
    enum: NotificationStatus,
    description: 'Filter logs by status (PENDING, SENT, FAILED, RETRYING)',
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({
    default: 0,
    description: 'Number of logs to skip',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({
    default: 20,
    description: 'Number of logs to return per page (max 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 20;
}
