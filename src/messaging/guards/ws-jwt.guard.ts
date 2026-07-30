import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { JwtPayload } from '../../auth/interfaces/jwt-payload';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Unauthorized: Missing access token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      if (!payload || !payload.sub) {
        throw new WsException('Unauthorized: Invalid token payload');
      }

      // Store authenticated user payload in socket.data
      client.data.user = {
        id: payload.sub,
        name: payload.name,
        role: payload.role,
      };

      return true;
    } catch {
      throw new WsException('Unauthorized: Invalid or expired token');
    }
  }

  private extractToken(client: Socket): string | null {
    const authHeader =
      client.handshake.auth?.token ||
      client.handshake.auth?.authorization ||
      client.handshake.headers?.authorization;    // the front-end sends it TODO see if u only need to check one of these, not all three or no

    if (authHeader) {
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      if (typeof authHeader === 'string') {
        return authHeader;
      }
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }
}
