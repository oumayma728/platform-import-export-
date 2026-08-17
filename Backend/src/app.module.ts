import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AccessTokenGuard } from './auth/guard/access-token.guard';
import { RolesGuard } from './auth/guard/roles.guard';
import { AdminAuthModule } from './admin/auth/admin-auth.module';
import { AdminDashboardModule } from './admin/dashboard/admin-dashboard.module';
import { ModerationHistoryModule } from './admin/moderation-history/moderation-history.module';
import { CompaniesModule } from './companies/companies.module';
import { ListingsModule } from './listings/listings.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', 'src/.env'],
      isGlobal: true,
    }),
    AuthModule,
    AdminAuthModule,
    AdminDashboardModule,
    ModerationHistoryModule,
    UsersModule,
    PrismaModule,
    CompaniesModule,
    ListingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
