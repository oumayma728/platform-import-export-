import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AccessTokenGuard } from './auth/guard/access-token.guard';
import { RolesGuard } from './auth/guard/roles.guard';
import { CompaniesModule } from './companies/companies.module';
import { ListingsModule } from './listings/listings.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { MessagingModule } from './messaging/messaging.module';
import { SupabaseModule } from './supabase/supabase.module';
import { StorageService } from './supabase/storage.service';
import { AdminModule } from './admin/admin.module';
import { BillingModule } from './billing/billing.module';
import { CurrencyModule } from './integrations/currency/currency.module';
import { LogisticsModule } from './integrations/logistics/logistics.module';
import { NotificationsModule } from './integrations/notifications/notifications.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', 'src/.env'],
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: Number(configService.get<string | number>('REDIS_PORT')) || 6379,
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    AuthModule,
    UsersModule,
    PrismaModule,
    CompaniesModule,
    ListingsModule,
    MessagingModule,
    SupabaseModule,
    AdminModule,
    BillingModule,
    CurrencyModule,
    LogisticsModule,
    NotificationsModule,
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
    StorageService,
  ],
})
export class AppModule {}

// TODO add log logic in all modules
// TODO change the english messages that goes back to the front in french
