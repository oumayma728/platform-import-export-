import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { JwtPayload } from '../interfaces/jwt-payload';
import { REFRESH_COOKIE } from '../../constants/variables';

@Injectable()
export class RefreshJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const refreshToken: unknown = request.cookies?.[REFRESH_COOKIE];

    if (typeof refreshToken !== 'string' || refreshToken.trim().length === 0) {
      throw new UnauthorizedException('Missing refresh token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (!this.hasRequiredClaims(payload)) {
        throw new UnauthorizedException('Invalid refresh token');
      }
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return true;
  }

  private hasRequiredClaims(payload: JwtPayload): boolean {
    return (
      typeof payload?.sub === 'string' &&
      payload.sub.trim().length > 0 &&
      typeof payload.jti === 'string' &&
      payload.jti.trim().length > 0
    );
  }
}
