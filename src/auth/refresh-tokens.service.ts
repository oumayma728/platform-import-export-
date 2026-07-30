import { Injectable } from '@nestjs/common';

import { RefreshTokensRepository } from './refresh-tokens.repository';

@Injectable()
export class RefreshTokensService {
  constructor(private readonly refreshTokensRepository: RefreshTokensRepository) {}

  /** Persist a new refresh-token hash. */
  async create(id: string, userId: string, tokenHash: string, expiresAt: Date) {
    return this.refreshTokensRepository.create(id, userId, tokenHash, expiresAt);
  }

  /** Look up a stored token by its jti (the record id). */
  async findById(id: string) {
    return this.refreshTokensRepository.findById(id);
  }

  /** Mark a single token as revoked (used during normal rotation). */
  async revoke(id: string): Promise<void> {
    await this.refreshTokensRepository.revoke(id);
  }

  /**
   * Revoke every refresh token for a user.
   * Called when reuse is detected — assumes the token family is compromised.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokensRepository.revokeAllForUser(userId);
  }
}

