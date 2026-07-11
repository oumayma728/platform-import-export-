import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshTokensService } from './refresh-tokens.service';
import { AccessTokenGuard } from './guard/access-token.guard';
import { RefreshJwtGuard } from './guard/refresh-jwt.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,          // gives ConfigService to our providers
    UsersModule,           // gives us UsersService
    JwtModule.register({}), // empty — we pass secrets per signAsync call
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokensService, AccessTokenGuard, RefreshJwtGuard],
  exports: [JwtModule, AccessTokenGuard], // other modules may need the guard/jwt
})
export class AuthModule {}
