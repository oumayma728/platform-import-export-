import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenGuard } from './guard/access-token.guard';
import { RefreshJwtGuard } from './guard/refresh-jwt.guard';
import { RolesGuard } from './guard/roles.guard';
import { RefreshTokensService } from './refresh-tokens.service';

@Module({
  imports: [ConfigModule, UsersModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokensService,
    AccessTokenGuard,
    RefreshJwtGuard,
    RolesGuard,
  ],
  exports: [JwtModule, AccessTokenGuard, RolesGuard, AuthService, RefreshJwtGuard],
})
export class AuthModule {}
