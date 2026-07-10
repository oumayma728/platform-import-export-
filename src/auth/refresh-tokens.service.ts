import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ──────────────────────────────────────────────
// This mirrors the future Prisma model:
//
//   model RefreshToken {
//     id        String   @id @default(uuid())
//     userId    String
//     tokenHash String
//     isRevoked Boolean  @default(false)
//     expiresAt DateTime
//     createdAt DateTime @default(now())
//   }
//
// When you add Prisma, replace each method body
// with the equivalent prisma.refreshToken.* call.
// ──────────────────────────────────────────────

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class RefreshTokensService {
  private readonly tokens: RefreshTokenRecord[] = [];

  /** Persist a new refresh-token hash. */
  create(userId: string, tokenHash: string, expiresAt: Date): RefreshTokenRecord {
    const record: RefreshTokenRecord = {
      id: randomUUID(),
      userId,
      tokenHash,
      isRevoked: false,
      expiresAt,
      createdAt: new Date(),
    };

    this.tokens.push(record);
    return record;
  }

  /** Look up a stored token by its jti (the record id). */
  findById(id: string): RefreshTokenRecord | undefined {
    return this.tokens.find((t) => t.id === id);
  }

  /** Mark a single token as revoked (used during normal rotation). */
  revoke(id: string): void {
    const token = this.findById(id);
    if (token) token.isRevoked = true;
  }

  /**
   * Revoke every refresh token for a user.
   * Called when reuse is detected — assumes the token family is compromised.
   */
  revokeAllForUser(userId: string): void {
    this.tokens
      .filter((t) => t.userId === userId)
      .forEach((t) => (t.isRevoked = true));
  }
}
