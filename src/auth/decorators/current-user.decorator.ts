import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../interfaces/auth-request';

/**
 * Extracts the authenticated user from the request.
 *
 * Usage:
 *   @Get('me')
 *   getProfile(@CurrentUser() user: AuthRequest['user']) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest<AuthRequest>().user;
  },
);
