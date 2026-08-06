import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthRequest } from '../interfaces/auth-request';
import { JwtPayload } from '../interfaces/jwt-payload';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Missing access token');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      if (!this.hasRequiredClaims(payload)) {
        throw new UnauthorizedException('Invalid access token payload');
      }

      request.user = {
        id: payload.sub,
        name: payload.name,
        role: payload.role,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return true;
  }

  private extractToken(request: Request): string | null {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : null;
  }

  private hasRequiredClaims(
    payload: JwtPayload,
  ): payload is JwtPayload & { sub: string; name: string; role: UserRole } {
    return (
      typeof payload?.sub === 'string' &&
      payload.sub.trim().length > 0 &&
      typeof payload.name === 'string' &&
      payload.name.trim().length > 0 &&
      Object.values(UserRole).includes(payload.role as UserRole)
    );
  }
}
