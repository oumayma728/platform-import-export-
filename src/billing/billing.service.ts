import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  BillingInterval,
  BillingStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { BillingRepository } from './billing.repo';
import { StripeService } from './stripe/stripe.service';
import { StripeWebhookService } from './stripe/stripe-webhook.service';
import { CreateCheckoutSessionResponseDto } from './dto/create-checkout-session.dto';
import { CancelSubscriptionResponseDto } from './dto/cancel-subscription.dto';
import { BillingRecommendationDto } from './dto/billing-recommendation.dto';

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
      throw new NotFoundException(
        `Active subscription plan with ID '${id}' not found`,
      );
    }
    return plan;
  }

  /**
   * Compare the user's cumulative successful PAYG spend with a subscription.
   * The frontend receives the business decision and only renders it.
   */
  async getBillingRecommendation(
    userId: string,
    interval: BillingInterval = BillingInterval.MENSUEL,
  ): Promise<BillingRecommendationDto> {
    const billingAccount = await this.billingRepo.findByUserId(userId);
    const plan =
      await this.billingRepo.findActiveSubscriptionPlanByInterval(interval);

    if (!plan) {
      throw new NotFoundException(
        `Active ${interval.toLowerCase()} subscription plan not found`,
      );
    }

    const cumulativePaygSpending = Number(
      billingAccount?.cumulativeUsageSpend ?? 0,
    );
    const subscriptionPrice = Number(plan.price);

    return {
      recommended: cumulativePaygSpending > subscriptionPrice,
      cumulativePaygSpending,
      subscriptionPrice,
      subscriptionInterval: plan.interval,
      currency: plan.currency,
    };
  }

  /**
   * Start subscription checkout flow for an authenticated user.
   * Returns a sanitized DTO with session ID and redirect URL.
   */
  async startSubscriptionCheckout(
    userId: string,
    planId: string,
    checkoutAttemptId: string,
  ): Promise<CreateCheckoutSessionResponseDto> {
    if (!checkoutAttemptId || checkoutAttemptId.trim().length > 255) {
      throw new BadRequestException(
        'A valid Idempotency-Key header is required for subscription checkout',
      );
    }

    const plan = await this.billingRepo.findActiveSubscriptionPlanById(planId);
    if (!plan) {
      throw new BadRequestException('Active subscription plan not found');
    }

    const billingAccount = await this.billingRepo.ensureBillingAccount(userId);

    // Prevent duplicate subscriptions if user is already active
    if (
      billingAccount.subscription?.status === SubscriptionStatus.ACTIF ||
      billingAccount.billingStatus === BillingStatus.ABONNE
    ) {
      throw new BadRequestException('User already has an active subscription');
    }

    const session = await this.stripeService.createCheckoutSession(
      userId,
      plan.id,
      plan.stripePriceId,
      billingAccount.id,
      checkoutAttemptId.trim(),
    );

    if (!session.url) {
      throw new BadRequestException(
        'Stripe Checkout Session URL was not generated',
      );
    }

    return {
      sessionId: session.id,
      checkoutUrl: session.url, // the stripe checkout URL
    };
  }

  /**
   * Starts a one-time $2 Checkout session for a single conversation.
   * Conversation access is granted only by the payment_intent.succeeded webhook.
   */
  async startConversationCheckout(input: {
    userId: string;
    billingAccountId: string;
    listingId: string;
    exporterCompanyId: string;
    importerCompanyId: string;
  }): Promise<CreateCheckoutSessionResponseDto> {
    const session =
      await this.stripeService.createConversationCheckoutSession(input);

    if (!session.url) {
      throw new BadRequestException(
        'Stripe Checkout Session URL was not generated',
      );
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
   * Cancel subscription for an authenticated user.
   * Cancels immediately on Stripe, marks subscription as ANNULE, and updates billing account.
   * If already canceled, returns the existing cancellation state without extra operations.
   */
  async cancelSubscription(
    userId: string,
  ): Promise<CancelSubscriptionResponseDto> {
    const billingAccount = await this.billingRepo.findByUserId(userId);
    if (!billingAccount || !billingAccount.subscription) {
      throw new BadRequestException('No active subscription found for user');
    }

    const subRecord = billingAccount.subscription;
    const stripeSubId = subRecord.stripeSubscriptionId;

    // If already canceled, return early without extra DB queries or Stripe calls
    if (
      subRecord.status === SubscriptionStatus.ANNULE ||
      subRecord.status === SubscriptionStatus.EXPIRE
    ) {
      return {
        message: 'Subscription is already canceled.',
        cancelAtPeriodEnd: subRecord.cancelAtPeriodEnd,
        currentPeriodEnd: subRecord.currentPeriodEnd,
      };
    }

    // Cancel immediately on Stripe
    try {
      await this.stripeService.cancelSubscriptionImmediately(stripeSubId);
    } catch (error: any) {
      if (
        error?.code === 'resource_missing' ||
        error?.message?.includes('already canceled') ||
        error?.message?.includes('No such subscription')
      ) {
        this.logger.warn(
          `Stripe subscription ${stripeSubId} already canceled or missing: ${error.message}`,
        );
      } else {
        throw error;
      }
    }

    const canceledAt = new Date();

    // Mark subscription as ANNULE in DB
    await this.billingRepo.updateSubscriptionStatus(stripeSubId, {
      status: SubscriptionStatus.ANNULE,
      canceledAt,
      cancelAtPeriodEnd: false,
    });

    // Mark billing account as ABONNEMENT_EXPIRE in DB
    await this.billingRepo.updateBillingAccountStatusById(
      billingAccount.id,
      BillingStatus.ABONNEMENT_EXPIRE,
    );

    this.logger.log(
      `Subscription ${stripeSubId} for user ${userId} canceled immediately.`,
    );

    return {
      message: 'Subscription canceled successfully.',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: subRecord.currentPeriodEnd,
    };
  }
}
