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
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import {
  ConflictErrorResponseDto,
  NotFoundErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ValidationErrorResponseDto,
} from '../common/dto/api-error-response.dto';
import { REFRESH_COOKIE } from '../common/constants/variables';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { AuthResponseDto, LogoutResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshJwtGuard } from './guard/refresh-jwt.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account, returns an access token in the response body, and sets the refresh token as an HttpOnly cookie.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'User registered successfully.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Request body validation failed. Unknown properties are rejected by the global ValidationPipe.',
    type: ValidationErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'A user with the same email already exists.',
    type: ConflictErrorResponseDto,
  })
  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @ApiOperation({
    summary: 'Log in',
    description:
      'Authenticates an existing user, returns an access token in the response body, and sets the refresh token as an HttpOnly cookie.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'User authenticated successfully.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request body validation failed.',
    type: ValidationErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'The provided credentials are invalid.',
    type: UnauthorizedErrorResponseDto,
  })
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

  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Uses the refresh token stored in the HttpOnly cookie to issue a new access token and rotate the refresh token.',
  })
  @ApiHeader({
    name: 'Cookie',
    required: true,
    description: `Cookie header containing ${REFRESH_COOKIE}. In browser-based clients, this is usually sent automatically by the browser.`,
  })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully.',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Refresh token is missing, invalid, expired, or already revoked.',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'The user associated with the refresh token no longer exists.',
    type: NotFoundErrorResponseDto,
  })
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

  @ApiOperation({
    summary: 'Log out',
    description:
      'Revokes the current refresh token and clears the refresh token cookie.',
  })
  @ApiHeader({
    name: 'Cookie',
    required: true,
    description: `Cookie header containing ${REFRESH_COOKIE}. In browser-based clients, this is usually sent automatically by the browser.`,
  })
  @ApiOkResponse({
    description: 'User logged out successfully.',
    type: LogoutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token is missing, invalid, or expired.',
    type: UnauthorizedErrorResponseDto,
  })
  @Public()
  @UseGuards(RefreshJwtGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (token) {
      await this.authService.logout(token);
    }

    this.clearRefreshCookie(res);
    return { message: 'Logged out' };
  }

  // TODO: see and modify this condition
  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: new ConfigService().get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: this.authService.refreshCookieMaxAgeMs,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: new ConfigService().get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/auth',
    });
  }
}
