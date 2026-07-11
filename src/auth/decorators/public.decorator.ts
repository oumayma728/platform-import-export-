import { SetMetadata } from '@nestjs/common';

/**
 * Routes decorated with @Public() bypass the global AccessTokenGuard.
 * Use on login, register, and any other unauthenticated endpoints.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
