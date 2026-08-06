import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

type CreateRefreshTokenInput = Pick<
  Prisma.RefreshTokenUncheckedCreateInput,
  'id' | 'userId' | 'tokenHash' | 'expiresAt'
>;

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRefreshTokenInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findById(id: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { id },
    });
  }

  async revoke(id: string): Promise<boolean> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, isRevoked: false },
      data: { isRevoked: true },
    });

    return count === 1;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}
