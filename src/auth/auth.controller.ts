import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthResponseDto, LogoutResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { RefreshJwtGuard } from './guard/refresh-jwt.guard';
import { REFRESH_COOKIE } from '../constants/variables';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Public routes ─────────────────────────────────────

  @ApiOperation({
    summary: 'Create a new user',
    description:
      'Registers a new user, returns an access token, and sets a refresh token cookie.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request payload.' })
  @ApiResponse({ status: 409, description: 'User already exists.' })
  @Public()
  @Post('register')
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @ApiOperation({
    summary: 'Log in an existing user',
    description:
      'Authenticates a user, returns an access token, and sets a refresh token cookie.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request payload.' })
  @ApiResponse({ status: 401, description: 'Invalid password.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  /**
   * Rotate the refresh token.
   * Marked @Public() because the refresh token (in the cookie) is
   * its own form of authentication — no access token needed.
   */
  @ApiOperation({
    summary: 'Refresh the access token and the refresh token',
    description:
      'Uses the refresh token cookie to issue a new access token and rotate the refresh token.',
  })
  @ApiHeader({
    name: 'Cookie',
    required: true,
    description:
      `HttpOnly cookie containing the refresh token (${REFRESH_COOKIE}).`,
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired refresh token.',
  })
  @ApiResponse({ status: 404, description: 'User no longer exists.' })
  @Public()
  @UseGuards(RefreshJwtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldRefreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (!oldRefreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(oldRefreshToken);

    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  /**
   * Revoke the current refresh token and clear the cookie.
   * Requires a valid access token (global guard handles that).
   */
  @ApiOperation({
    summary: 'Log out the current user',
    description:
      'Revokes the current refresh token and clears the refresh token cookie.',
  })
  @ApiHeader({
    name: 'Cookie',
    required: true,
    description:
      `HttpOnly cookie containing the refresh token (${REFRESH_COOKIE}).`,
  })
  @ApiResponse({
    status: 200,
    description: 'User logged out successfully.',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired refresh token.',
  })
  @Public()
  @UseGuards(RefreshJwtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (token) {
      await this.authService.logout(token);
    }

    this.clearRefreshCookie(res);
    return { message: 'Logged out' };
  }

  // ─── Cookie helpers ────────────────────────────────────

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: this.authService.refreshCookieMaxAgeMs,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
    });
  }
}
