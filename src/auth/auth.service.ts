import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import * as argon2 from 'argon2';

import { UsersRepository } from '../users/users.repository';
import { RefreshTokensService } from './refresh-tokens.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Tokens } from './interfaces/tokens.interface';
import { JwtPayload } from './interfaces/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokensService: RefreshTokensService,
  ) {}

  // ─── Public API ────────────────────────────────────────

  /** Register a new user and return a token pair. */
  async register(dto: RegisterDto): Promise<Tokens> {
    const passwordHash = await argon2.hash(dto.password);

    // check if there's a user with this credentials
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) throw new ConflictException('User already exists');

    const user = await this.usersRepository.createUser({
      email: dto.email,
      name: dto.name,
      phone: dto.phone_number,
      roles: dto.role,
      passwordHash,
    });

    return this.generateTokens(user.id, user.name);
  }

  /** Validate credentials and return a token pair. */
  async login(dto: LoginDto): Promise<Tokens> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) throw new NotFoundException('Invalid credentials');

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.name);
  }

  /**
   * Rotate the refresh token:
   *  1. Verify the JWT signature
   *  2. Look up the stored record by jti
   *  3. If already revoked → reuse detected → revoke ALL for user
   *  4. Verify hash match & expiry
   *  5. Revoke old token, issue a fresh pair
   */
  async refreshTokens(rawRefreshToken: string): Promise<Tokens> {
    // 1. Verify JWT signature & decode
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(rawRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { sub: userId, jti: tokenId } = payload;
    if (!tokenId) throw new UnauthorizedException('Malformed refresh token');

    // 2. Find the stored record
    const stored = await this.refreshTokensService.findById(tokenId);
    if (!stored) throw new UnauthorizedException('Refresh token not recognised');

    // 3. Reuse detection — a revoked token being presented again
    //    means an attacker may have stolen the previous token.
    //    Kill every session for this user as a precaution.
    if (stored.isRevoked) {
      await this.refreshTokensService.revokeAllForUser(userId);
      throw new UnauthorizedException('Refresh token reuse detected — all sessions revoked. Please log in again.');
    }

    // 4. Verify the raw token hashes to the stored hash
    if (this.hashToken(rawRefreshToken) !== stored.tokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 5. Check expiry (belt-and-suspenders — JWT verify already checks exp)
    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // 6. Rotate: revoke the old token and issue a new pair
    await this.refreshTokensService.revoke(tokenId);

    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User no longer exists');

    return this.generateTokens(user.id, user.name);
  }

  /** Revoke a single refresh token (logout current device). */
  async logout(rawRefreshToken: string): Promise<void> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(rawRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      // Token is invalid/expired — nothing to revoke, just return.
      return;
    }
    if (payload.jti) {
      await this.refreshTokensService.revoke(payload.jti);
    }
  }

  /** The max-age value (in ms) for the refresh-token cookie. */
  get refreshCookieMaxAgeMs(): number {
    const ttl = this.configService.get<string>('JWT_REFRESH_TTL', '15d');
    return this.parseTtlToMs(ttl);
  }

  // ─── Private helpers ───────────────────────────────────

  /**
   * Generate an access + refresh token pair.
   * The refresh token hash is stored immediately.
   */
  private async generateTokens(userId: string, name: string): Promise<Tokens> {
    const refreshTokenId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, name } as any,
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get<string>('JWT_ACCESS_TTL') as any,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, jti: refreshTokenId } as any,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_TTL') as any,
        },
      ),
    ]);

    // Store only the hash — never the raw token
    const ttlMs = this.refreshCookieMaxAgeMs;
    await this.refreshTokensService.create(
      userId,
      this.hashToken(refreshToken),
      new Date(Date.now() + ttlMs),
    );

    return { accessToken, refreshToken };
  }

  /** One-way SHA-256 hash of the raw token. */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Convert TTL strings like "15m", "1h", "15d" to milliseconds. */
  private parseTtlToMs(ttl: string): number {
    const match = ttl.match(/^(\d+)(s|m|h|d)$/);
    if (!match) throw new Error(`Invalid TTL format: "${ttl}"`);

    const value = parseInt(match[1], 10);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';

    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return value * multipliers[unit];
  }
}