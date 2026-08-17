import { Injectable } from '@nestjs/common';
import {
  ModerationActionType,
  ModerationEntityType,
  Prisma,
} from '@prisma/client';

import { ModerationHistoryRepository } from './moderation-history.repository';
import {
  ModerationHistoryListResponseDto,
} from './dto/moderation-history-response.dto';

@Injectable()
export class ModerationHistoryService {
  constructor(
    private readonly moderationHistoryRepository: ModerationHistoryRepository,
  ) {}


  async createModerationHistory(params: {
    entityType: ModerationEntityType;
    entityId: string;
    actionType: ModerationActionType;
    adminId: string;
    details?: Prisma.InputJsonValue;
  }) {
    return this.moderationHistoryRepository.createModerationHistory(params);
  }

  
  async getModerationHistory(
    entityType: ModerationEntityType,
    entityId: string,
    page: number,
    limit: number,
  ): Promise<ModerationHistoryListResponseDto> {
    const skip = (page - 1) * limit;

    const { items, total } =
      await this.moderationHistoryRepository.findModerationHistory({
        entityType,
        entityId,
        skip,
        take: limit,
      });

    return {
      data: items,
      page,
      limit,
      total,
    };
  }
}
