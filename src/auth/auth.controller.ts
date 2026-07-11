import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { RefreshJwtGuard } from './guard/refresh-jwt.guard';
import { UseGuards } from '@nestjs/common';
import { REFRESH_COOKIE } from '../constants/variables';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    // ─── Public routes ─────────────────────────────────────

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
    @Public()
    @UseGuards(RefreshJwtGuard)
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const oldRefreshToken = req.cookies?.[REFRESH_COOKIE];
        const { accessToken, refreshToken } = await this.authService.refreshTokens(oldRefreshToken);

        this.setRefreshCookie(res, refreshToken);
        return { accessToken };
    }

    /**
     * Revoke the current refresh token and clear the cookie.
     * Requires a valid access token (global guard handles that).
     */
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const token = req.cookies?.[REFRESH_COOKIE];
        if (token) await this.authService.logout(token);

        this.clearRefreshCookie(res);
        return { message: 'Logged out' };
    }

    // ─── Cookie helpers ────────────────────────────────────

    private setRefreshCookie(res: Response, token: string): void {
        res.cookie(REFRESH_COOKIE, token, {
            httpOnly: true,                               // JS cannot read it
            secure: process.env.NODE_ENV === 'production', // HTTPS only in prod  TODO
            sameSite: 'strict',                            // CSRF protection
            path: '/auth',                                 // only sent to /auth/*
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