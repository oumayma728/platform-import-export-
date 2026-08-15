import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeWebhookService } from './stripe-webhook.service';
import { UsersModule } from '../../users/users.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillingRepository } from '../billing.repo';

@Module({
  imports: [UsersModule, PrismaModule],
  providers: [StripeService, StripeWebhookService, BillingRepository],
  exports: [StripeService, StripeWebhookService],
})
export class StripeModule {}
