import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BillingStatus, SubscriptionStatus } from '@prisma/client';
import { BillingRepository } from './billing.repo';
import { StripeService } from './stripe/stripe.service';
import { StripeWebhookService } from './stripe/stripe-webhook.service';
import { CreateCheckoutSessionResponseDto } from './dto/create-checkout-session.dto';
import { CancelSubscriptionResponseDto } from './dto/cancel-subscription.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly billingRepo: BillingRepository,
    private readonly stripeService: StripeService,
    private readonly stripeWebhookService: StripeWebhookService,
  ) {}

  /**
   * Retrieve active subscription plan by ID.
   */
  async getSubscriptionPlanPrice(id: string) {
    const plan = await this.billingRepo.findActiveSubscriptionPlanById(id);
    if (!plan) {
      throw new NotFoundException(`Active subscription plan with ID '${id}' not found`);
    }
    return plan;
  }

  /**
   * Start subscription checkout flow for an authenticated user.
   * Returns a sanitized DTO with session ID and redirect URL.
   */
  async startSubscriptionCheckout(
    userId: string,
    planId: string,
  ): Promise<CreateCheckoutSessionResponseDto> {
    const plan = await this.billingRepo.findActiveSubscriptionPlanById(planId);
    if (!plan) {
      throw new BadRequestException('Active subscription plan not found');
    }
 
    let billingAccount = await this.billingRepo.findByUserId(userId);
    if (!billingAccount) {
      billingAccount = await this.billingRepo.createBillingAccount(userId);
    }
    if (!billingAccount) {
      throw new BadRequestException('Billing account could not be found or created');
    }

    // Prevent duplicate subscriptions if user is already active
    if (
      billingAccount.subscription?.status === SubscriptionStatus.ACTIVE ||
      billingAccount.status === BillingStatus.ABONNE
    ) {
      throw new BadRequestException('User already has an active subscription');
    }

    const session = await this.stripeService.createCheckoutSession(
      userId,
      plan.id,
      plan.stripePriceId,
      billingAccount.id,
    );

    if (!session.url) {
      throw new BadRequestException('Stripe Checkout Session URL was not generated');
    }

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  }

  /**
   * Delegate webhook processing to StripeWebhookService.
   */
  async handleStripeWebhook(rawBody: Buffer | string, signature: string) {
    return this.stripeWebhookService.handleWebhookEvent(rawBody, signature);
  }

  /**
   * Schedule subscription cancellation for an authenticated user at the end of their paid period.
   * Retains active access until the period expires.
   */
  async cancelSubscription(userId: string): Promise<CancelSubscriptionResponseDto> {
    const billingAccount = await this.billingRepo.findByUserId(userId);
    if (!billingAccount || !billingAccount.subscription) {
      throw new BadRequestException('No active subscription found for user');
    }

    const subRecord = billingAccount.subscription;
    const stripeSubId = subRecord.stripeSubscriptionId;

    // Request Stripe to cancel subscription at current period end
    const stripeSub = await this.stripeService.cancelSubscriptionAtPeriodEnd(stripeSubId);

    const periodEnd = stripeSub.items?.data?.[0]?.current_period_end
      ? new Date(stripeSub.items.data[0].current_period_end * 1000)
      : subRecord.currentPeriodEnd;

    // Record cancellation timestamp without immediately revoking paid access
    await this.billingRepo.updateSubscriptionStatus(stripeSubId, {
      status: subRecord.status,
      canceledAt: new Date(),
      currentPeriodEnd: periodEnd,
    });

    this.logger.log(
      `Subscription ${stripeSubId} for user ${userId} scheduled for cancellation at period end (${periodEnd?.toISOString()}).`,
    );

    return {
      message: 'Subscription cancellation scheduled at the end of the billing period.',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: periodEnd,
    };
  }
}
