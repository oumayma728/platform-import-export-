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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AuthResponseDto, LogoutResponseDto } from '../../auth/dto/auth-response.dto';
import { LoginDto } from '../../auth/dto/login.dto';
import { RefreshJwtGuard } from '../../auth/guard/refresh-jwt.guard';
import { REFRESH_COOKIE } from '../../constants/variables';
import {
  UnauthorizedErrorResponseDto,
  ValidationErrorResponseDto,
} from '../../common/dto/api-error-response.dto';
import { AdminAuthService } from './admin-auth.service';
import { UserRole } from '@prisma/client';


@ApiTags('Admin – Authentication')
@Controller('admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @ApiOperation({
    summary: 'Admin login',
    description:
      'Authenticates an administrator. Returns an access token in the response body and sets an HttpOnly refresh token cookie. Fails if the user does not have the ADMIN role.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Admin authenticated successfully.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Request body validation failed.',
    type: ValidationErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or user is not an administrator.',
    type: UnauthorizedErrorResponseDto,
  })
  @Public()           
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.adminAuthService.adminLogin(dto);

    this.setAdminRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @ApiOperation({
    summary: 'Admin logout',
    description:
      'Revokes the admin refresh token and clears the HttpOnly cookie.',
  })
  @ApiOkResponse({
    description: 'Admin logged out successfully.',
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
  async adminLogout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }

    await this.adminAuthService.adminLogout(token);
    this.clearAdminRefreshCookie(res);
    return { message: 'Admin logged out successfully' };
  }

 
  private setAdminRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/admin',   // Scoped to /admin routes only
      maxAge: this.adminAuthService.refreshCookieMaxAgeMs,
    });
  }

  private clearAdminRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/admin',
    });
  }
}
