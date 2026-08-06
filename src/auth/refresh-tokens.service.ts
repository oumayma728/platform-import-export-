import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';

import { RefreshTokensRepository } from './refresh-tokens.repository';

type CreateRefreshTokenInput = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

@Injectable()
export class RefreshTokensService {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  /** Persist a new refresh-token hash. */
  async create({
    id,
    userId,
    tokenHash,
    expiresAt,
  }: CreateRefreshTokenInput): Promise<RefreshToken> {
    return this.refreshTokensRepository.create({
      id,
      userId,
      tokenHash,
      expiresAt,
    });
  }

  /** Look up a stored token by its jti (the record id). */
  async findById(id: unknown): Promise<RefreshToken | null> {
    if (!this.isValidId(id)) {
      return null;
    }

    return this.refreshTokensRepository.findById(id);
  }

  /** Mark a single token as revoked (used during normal rotation). */
  async revoke(id: unknown): Promise<boolean> {
    if (!this.isValidId(id)) {
      return false;
    }

    return this.refreshTokensRepository.revoke(id);
  }

  /**
   * Revoke every refresh token for a user.
   * Called when reuse is detected — assumes the token family is compromised.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokensRepository.revokeAllForUser(userId);
  }

  private isValidId(id: unknown): id is string {
    return typeof id === 'string' && id.trim().length > 0;
  }
}
