import { Injectable } from '@nestjs/common';
import {
  ModerationActionType,
  ModerationEntityType,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ModerationHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

 
  async createModerationHistory(params: {
    entityType: ModerationEntityType;
    entityId: string;
    actionType: ModerationActionType;
    adminId: string;
    details?: Prisma.InputJsonValue;
  }) {
    return this.prisma.moderationHistory.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        actionType: params.actionType,
        adminId: params.adminId,
        details: params.details ?? Prisma.JsonNull,
      },
    });
  }

 
  async findModerationHistory(params: {
    entityType: ModerationEntityType;
    entityId: string;
    skip: number;
    take: number;
  }): Promise<{
    items: Awaited<ReturnType<typeof this.prisma.moderationHistory.findMany>>;
    total: number;
  }> {
    const where: Prisma.ModerationHistoryWhereInput = {
      entityType: params.entityType,
      entityId: params.entityId,
    };

    const [items, total] = await Promise.all([
      this.prisma.moderationHistory.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.moderationHistory.count({ where }),
    ]);

    return { items, total };
  }
}
