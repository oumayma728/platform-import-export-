import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeWebhookService } from './stripe-webhook.service';
import { UsersModule } from '../../users/users.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { BillingRepository } from '../billing.repo';
import { NotificationsModule } from '../../integrations/notifications/notifications.module';

@Module({
  imports: [UsersModule, PrismaModule, NotificationsModule],
  providers: [StripeService, StripeWebhookService, BillingRepository],
  exports: [StripeService, StripeWebhookService],
})
export class StripeModule {}
