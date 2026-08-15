import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingRepository } from './billing.repo';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from './stripe/stripe.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, StripeModule, UsersModule],
  controllers: [BillingController],
  providers: [BillingService, BillingRepository],
  exports: [BillingService, BillingRepository],
})
export class BillingModule {}
