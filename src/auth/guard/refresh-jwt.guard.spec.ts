import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { RefreshJwtGuard } from './refresh-jwt.guard';
import { JwtPayload } from '../interfaces/jwt-payload';

describe('RefreshJwtGuard', () => {
  let guard: RefreshJwtGuard;
  let jwtService: JwtService;
  let configService: ConfigService;
  let context: Partial<ExecutionContext>;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;

    configService = {
      get: jest.fn().mockReturnValue('refresh-secret'),
    } as unknown as ConfigService;

    guard = new RefreshJwtGuard(jwtService, configService);
    context = {
      switchToHttp: () => ({
        getRequest: () => ({ cookies: { refresh_token: 'token' } }),
      }),
    };
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow valid refresh token', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: 'user-id', jti: 'token-id' } as JwtPayload);

    await expect(guard.canActivate(context as ExecutionContext)).resolves.toBe(true);
    expect(configService.get).toHaveBeenCalledWith('JWT_REFRESH_SECRET');
  });

  it('should reject missing refresh token', async () => {
    context.switchToHttp = () => ({ getRequest: () => ({ cookies: {} }) });

    await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject invalid refresh token payload', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ sub: null, jti: null });

    await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject expired or invalid token verification failure', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('invalid token'));

    await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(UnauthorizedException);
  });
  
});
