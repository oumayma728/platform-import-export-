import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import type { StringValue } from 'ms';
import * as argon2 from 'argon2';

import { UsersRepository } from '../users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload';
import { Tokens } from './interfaces/tokens.interface';
import { RefreshTokensService } from './refresh-tokens.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokensService: RefreshTokensService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Tokens> {
    const passwordHash = await argon2.hash(registerDto.password);

    const existingUser = await this.usersRepository.findByEmail(
      registerDto.email,
    );
    if (existingUser) throw new ConflictException('User already exists');

    const user = await this.usersRepository.createUser({
      email: registerDto.email,
      name: registerDto.name,
      phone: registerDto.phone,
      passwordHash,
    });

    return this.generateTokens(user.id, user.name, user.role);
  }

  async login(loginDto: LoginDto): Promise<Tokens> {
    const user = await this.usersRepository.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await argon2.verify(
      user.passwordHash,
      loginDto.password,
    );
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user.id, user.name, user.role);
  }

  async refreshTokens(rawRefreshToken: string): Promise<Tokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(rawRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { sub: userId, jti: tokenId } = payload;
    if (!this.isNonEmptyString(userId) || !this.isNonEmptyString(tokenId)) {
      throw new UnauthorizedException('Malformed refresh token');
    }

    const stored = await this.refreshTokensService.findById(tokenId);
    if (!stored) {
      throw new UnauthorizedException('Refresh token not recognised');
    }

    if (stored.isRevoked) {
      await this.refreshTokensService.revokeAllForUser(stored.userId);
      throw new UnauthorizedException(
        'Refresh token reuse detected — all sessions revoked. Please log in again.',
      );
    }

    if (stored.userId !== userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (this.hashToken(rawRefreshToken) !== stored.tokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const revoked = await this.refreshTokensService.revoke(tokenId);
    if (!revoked) {
      await this.refreshTokensService.revokeAllForUser(stored.userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User no longer exists');

    return this.generateTokens(user.id, user.name, user.role);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(rawRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      return;
    }

    if (this.isNonEmptyString(payload.jti)) {
      await this.refreshTokensService.revoke(payload.jti);
    }
  }

  get refreshCookieMaxAgeMs(): number {
    const ttl = this.configService.get<string>('JWT_REFRESH_TTL', '15d');
    return this.parseTtlToMs(ttl);
  }

  private async generateTokens(
    userId: string,
    name: string,
    role: UserRole,
  ): Promise<Tokens> {
    const refreshTokenId = randomUUID();

    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
    ) as string;
    const accessTtl = this.configService.get<string>(
      'JWT_ACCESS_TTL',
    ) as StringValue;
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
    ) as string;
    const refreshTtl = this.configService.get<string>(
      'JWT_REFRESH_TTL',
    ) as StringValue;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, name, role },
        {
          secret: accessSecret,
          expiresIn: accessTtl,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, jti: refreshTokenId },
        {
          secret: refreshSecret,
          expiresIn: refreshTtl,
        },
      ),
    ]);

    const ttlMs = this.refreshCookieMaxAgeMs;
    await this.refreshTokensService.create({
      id: refreshTokenId,
      userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + ttlMs),
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

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
