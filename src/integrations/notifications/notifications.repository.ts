import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NotificationChannel,
  NotificationStatus,
  type Prisma,
} from '@prisma/client';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(data: Prisma.NotificationLogUncheckedCreateInput) {
    return this.prisma.notificationLog.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.notificationLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    extra?: {
      errorMessage?: string | null;
      sentAt?: Date | null;
      lastAttemptAt?: Date | null;
      attempts?: number;
    },
  ) {
    return this.prisma.notificationLog.update({
      where: { id },
      data: {
        status,
        ...(extra?.errorMessage !== undefined && {
          errorMessage: extra.errorMessage,
        }),
        ...(extra?.sentAt !== undefined && { sentAt: extra.sentAt }),
        ...(extra?.lastAttemptAt !== undefined && {
          lastAttemptAt: extra.lastAttemptAt,
        }),
        ...(extra?.attempts !== undefined && { attempts: extra.attempts }),
      },
    });
  }

  async incrementAttempt(
    id: string,
    params: {
      errorMessage?: string;
      isFinalFailure?: boolean;
    },
  ) {
    const current = await this.prisma.notificationLog.findUnique({
      where: { id },
      select: { attempts: true },
    });

    const newAttempts = (current?.attempts ?? 0) + 1;
    const newStatus = params.isFinalFailure
      ? NotificationStatus.FAILED
      : NotificationStatus.RETRYING;

    return this.prisma.notificationLog.update({
      where: { id },
      data: {
        attempts: newAttempts,
        status: newStatus,
        lastAttemptAt: new Date(),
        errorMessage: params.errorMessage ?? null,
      },
    });
  }

  async findFailed(limit = 50) {
    return this.prisma.notificationLog.findMany({
      where: {
        status: NotificationStatus.FAILED,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async findLogs(params: {
    userId?: string;
    channel?: NotificationChannel;
    status?: NotificationStatus;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.NotificationLogWhereInput = {
      ...(params.userId && { userId: params.userId }),
      ...(params.channel && { channel: params.channel }),
      ...(params.status && { status: params.status }),
    };

    const [items, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notificationLog.count({ where }),
    ]);

    return { items, total };
  }
}
