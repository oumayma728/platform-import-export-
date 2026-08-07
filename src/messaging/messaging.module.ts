import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../prisma/prisma.module';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { MessagingController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';
import { MessagingRepository } from './messaging.repository';
import { MessagingService } from './messaging.service';
import { ListingsModule } from '../listings/listings.module';
import { UsersModule } from '../users/users.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [PrismaModule, JwtModule.register({}), ListingsModule, UsersModule, SupabaseModule],
  controllers: [MessagingController],
  providers: [MessagingGateway, MessagingService, MessagingRepository, WsJwtGuard],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
