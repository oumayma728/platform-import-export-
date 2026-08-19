import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../users/users.repository';
import { BillingRepository } from '../billing.repo';
import { CONVERSATION_COST } from '../../common/constants/variables';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    private readonly billingRepository: BillingRepository,
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error(
        'STRIPE_SECRET_KEY is not defined. Please configure it in your environment.',
      );
    }

    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET is not defined. Please configure it in your environment.',
      );
    }
    this.webhookSecret = webhookSecret;

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2026-07-29.dahlia',
    });
  }

  /**
   * Construct and verify a Stripe Webhook Event using the raw body and signature.
   */
  constructEventFromPayload(
    rawBody: Buffer | string,
    signature: string,
  ): Stripe.Event {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header.');
    }

    try {
      return this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err: any) {
      this.logger.error(
        `Webhook signature verification failed: ${err.message}`,
      );
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  /**
   * Ensure a verified Stripe Customer exists for the given user.
   */
  async getOrCreateCustomer(
    userId: string,
    billingAccountId: string,
  ): Promise<string> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const billingRecord = await this.billingRepository.findByUserId(user.id);
    let customerId = billingRecord?.stripeCustomerId;

    // Verify existing customer in Stripe if present
    if (customerId) {
      try {
        const existingCustomer =
          await this.stripe.customers.retrieve(customerId);
        if (!existingCustomer.deleted) {
          return existingCustomer.id;
        }
        this.logger.warn(
          `Customer ${customerId} for user ${userId} is marked as deleted in Stripe. Recreating.`,
        );
        customerId = undefined;
      } catch (err: any) {
        // Only recreate if Stripe explicitly indicates that the customer no longer exists (resource_missing / 404)
        if (err?.code === 'resource_missing' || err?.statusCode === 404) {
          this.logger.warn(
            `Customer ${customerId} for user ${userId} does not exist in Stripe (${err.message}). Recreating.`,
          );
          customerId = undefined;
        } else {
          this.logger.error(
            `Temporary or unexpected error retrieving customer ${customerId} from Stripe: ${err.message}`,
          );
          throw err;
        }
      }
    }

    // Create a new Stripe Customer
    const stripeCustomer = await this.stripe.customers.create(
      {
        email: user.email,
        name: user.name,
        metadata: { userId, billingAccountId },
      },
      { idempotencyKey: `customer:create:${userId}` },
    );

    await this.billingRepository.setStripeCustomerIdByUserId(
      user.id,
      stripeCustomer.id,
    );
    return stripeCustomer.id;
  }

  /**
   * Create a Stripe Checkout Session for subscription mode.
   */
  async createCheckoutSession(
    userId: string,
    planId: string,
    priceId: string,
    billingAccountId: string,
  ): Promise<Stripe.Checkout.Session> {
    if (!priceId || !priceId.startsWith('price_')) {
      throw new BadRequestException(
        'Invalid price ID format in subscription plan',
      );
    }

    const customerId = await this.getOrCreateCustomer(userId, billingAccountId);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    // Stable idempotency key based on user, plan, and customer
    const idempotencyKey = `checkout:${userId}:${planId}:${customerId}`;

    const session = await this.stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          planId,
          billingAccountId,
        },
        subscription_data: {
          metadata: {
            userId,
            planId,
            billingAccountId,
          },
        },
        success_url: `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}`,
      },
      { idempotencyKey },
    );

    this.logger.log(
      `Created checkout session ${session.id} for user ${userId}`,
    );
    return session;
  }

  /**
   * Create a one-time Checkout session for one conversation after the free
   * quota has been exhausted. The metadata is copied to the PaymentIntent so
   * the webhook can grant access only after Stripe marks it as succeeded.
   */
  async createConversationCheckoutSession(input: {
    userId: string;
    billingAccountId: string;
    listingId: string;
    exporterCompanyId: string;
    importerCompanyId: string;
  }): Promise<Stripe.Checkout.Session> {
    const customerId = await this.getOrCreateCustomer(
      input.userId,
      input.billingAccountId,
    );
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const metadata = {
      billingAccountId: input.billingAccountId,
      listingId: input.listingId,
      exporterCompanyId: input.exporterCompanyId,
      importerCompanyId: input.importerCompanyId,
    };

    const session = await this.stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: 'Conversation access' },
              unit_amount: CONVERSATION_COST * 100, // Convert dollars to cents
            },
            quantity: 1,
          },
        ],
        metadata,
        payment_intent_data: { metadata },
        success_url: `${frontendUrl}/billing/conversation-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/billing/conversation-cancel`,
      },
      {
        idempotencyKey: `conversation-checkout:${input.billingAccountId}:${input.listingId}:${input.exporterCompanyId}:${input.importerCompanyId}`,
      },
    );

    this.logger.log(
      `Created conversation checkout session ${session.id} for user ${input.userId}`,
    );
    return session;
  }

  /**
   * Retrieve a subscription from Stripe.
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Schedule cancellation of a subscription at the end of the current billing period.
   */
  async cancelSubscriptionAtPeriodEnd(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  /**
   * Immediately cancel a subscription in Stripe.
   */
  async cancelSubscriptionImmediately(
    subscriptionId: string,
  ): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.cancel(subscriptionId);
  }
}
