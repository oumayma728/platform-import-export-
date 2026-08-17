import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RefreshTokensService {
  constructor(private readonly prisma: PrismaService) {}

  /** Persist a new refresh-token hash. */
  async create(id: string, userId: string, tokenHash: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: {
        id,
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  /** Look up a stored token by its jti (the record id). */
  async findById(id: string) {
    return this.prisma.refreshToken.findUnique({
      where: {
        id,
      },
    });
  }

  /** Mark a single token as revoked (used during normal rotation). */
  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.update({
      where: {
        id,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  /**
   * Revoke every refresh token for a user.
   * Called when reuse is detected — assumes the token family is compromised.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
      },
      data: {
        isRevoked: true,
      },
    });
  }
}

