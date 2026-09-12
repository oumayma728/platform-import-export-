import { Injectable, Logger } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { BillingRepository } from '../billing.repo';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersRepository } from '../../users/users.repository';
import { NotificationsService } from '../../integrations/notifications/notifications.service';
import {
  BillingStatus,
  SubscriptionStatus,
  TransactionStatus,
  TransactionType,
  Prisma,
} from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly billingRepo: BillingRepository,
    private readonly prismaService: PrismaService,
    private readonly usersRepository: UsersRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Main entry point to process verified Stripe Webhook events idempotently.
   */
  async handleWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
  ): Promise<{ received: boolean; duplicate?: boolean }> {
    const event = this.stripeService.constructEventFromPayload(
      rawBody,
      signature,
    );
    this.logger.log(
      `Processing Stripe event [${event.id}] of type: ${event.type}`,
    );

    // Quick idempotency check before any work
    const alreadyProcessed = await this.billingRepo.isWebhookEventProcessed(
      event.id,
    );
    if (alreadyProcessed) {
      this.logger.log(`Event [${event.id}] was already processed. Skipping.`);
      return { received: true, duplicate: true };
    }

    // Step 1: External Stripe API calls executed OUTSIDE database transactions
    let subscriptionDetails: Stripe.Subscription | null = null;
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription' && session.subscription) {
        const subId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;
        try {
          subscriptionDetails = await this.stripeService.getSubscription(subId);
        } catch (err: any) {
          this.logger.warn(
            `Could not pre-fetch subscription ${subId} from Stripe: ${err.message}`,
          );
        }
      }
    } else if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = this.extractInvoiceSubscriptionId(invoice);
      if (subId) {
        try {
          subscriptionDetails = await this.stripeService.getSubscription(subId);
        } catch (err: any) {
          this.logger.warn(
            `Could not pre-fetch subscription ${subId} from Stripe: ${err.message}`,
          );
        }
      }
    }

    // Step 2: Atomic database operations within a bounded transaction
    const result = await this.prismaService.$transaction(async (tx) => {
      // Atomic deduplication lock inside transaction
      const recorded = await this.billingRepo.recordWebhookEvent(
        event.id,
        event.type,
        tx,
      );
      if (!recorded) {
        this.logger.log(
          `Event [${event.id}] duplicate detected during insertion. Skipping.`,
        );
        return { received: true, duplicate: true };
      }

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.id,
            event.data.object as Stripe.Checkout.Session,
            subscriptionDetails,
            tx,
          );
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(
            event.id,
            event.data.object as Stripe.Invoice,
            subscriptionDetails,
            tx,
          );
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(
            event.id,
            event.data.object as Stripe.Invoice,
            tx,
          );
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
            tx,
          );
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
            tx,
          );
          break;

        case 'payment_intent.succeeded':
          await this.handleConversationPaymentSucceeded(
            event.id,
            event.data.object as Stripe.PaymentIntent,
            tx,
          );
          break;

        default:
          this.logger.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return { received: true };
    });

    return result;
  }

  /**
   * Handle checkout.session.completed.
   * Links customer & subscription metadata.
   * NOTE: invoice.paid is the authoritative event for payment confirmation and ABONNE activation.
   */
  private async handleCheckoutSessionCompleted(
    eventId: string,
    session: Stripe.Checkout.Session,
    subscriptionDetails: Stripe.Subscription | null,
    tx: Prisma.TransactionClient,
  ) {
    if (session.mode !== 'subscription') {
      return;
    }

    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const billingAccountId = session.metadata?.billingAccountId;
    const customerId = this.getStripeObjectId(session.customer);
    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    // Resolve BillingAccount by ID first, then by customer ID, then by user ID
    let billingAccount;
    if (billingAccountId) {
      billingAccount = await this.billingRepo.findBillingAccountById(
        billingAccountId,
        tx,
      );
    }
    if (!billingAccount && customerId) {
      billingAccount =
        await this.billingRepo.findBillingAccountByStripeCustomerId(
          customerId,
          tx,
        );
    }
    if (!billingAccount && userId) {
      billingAccount = await this.billingRepo.findByUserId(userId, tx);
    }

    if (!billingAccount) {
      throw new Error(
        `BillingAccount could not be resolved for checkout session ${session.id} (billingAccountId: ${billingAccountId}, user: ${userId}, customer: ${customerId}). Will retry.`,
      );
    }

    // Link Stripe customer ID if not already set
    if (customerId && !billingAccount.stripeCustomerId) {
      await this.billingRepo.setStripeCustomerIdByAccountId(
        billingAccount.id,
        customerId,
        tx,
      );
    }

    // NOTE: invoice.paid is authoritative for creating the local Subscription, recording transaction, and activating ABONNE.
    this.logger.log(
      `Linked checkout session ${session.id} (customer: ${customerId}, subscription: ${stripeSubscriptionId}) to BillingAccount ${billingAccount.id}. Awaiting invoice.paid to create and activate subscription.`,
    );
  }

  /**
   * Handle invoice.paid event.
   * Authoritative source for subscription payments, renewals, and ABONNE status activation.
   */
  private async handleInvoicePaid(
    eventId: string,
    invoice: Stripe.Invoice,
    subscriptionDetails: Stripe.Subscription | null,
    tx: Prisma.TransactionClient,
  ) {
    const customerId = this.getStripeObjectId(invoice.customer);
    const stripeSubscriptionId = this.extractInvoiceSubscriptionId(invoice);
    const invoiceMetadata = this.extractInvoiceMetadata(invoice);

    let billingAccount;
    let existingSub: Awaited<
      ReturnType<BillingRepository['findSubscriptionByStripeId']>
    > = null;

    if (stripeSubscriptionId) {
      existingSub = await this.billingRepo.findSubscriptionByStripeId(
        stripeSubscriptionId,
        tx,
      );
      if (existingSub) {
        billingAccount = existingSub.billingAccount;
      }
    }

    if (!billingAccount && customerId) {
      billingAccount =
        await this.billingRepo.findBillingAccountByStripeCustomerId(
          customerId,
          tx,
        );
    }

    if (!billingAccount && invoiceMetadata?.billingAccountId) {
      billingAccount = await this.billingRepo.findBillingAccountById(
        invoiceMetadata.billingAccountId,
        tx,
      );
    }

    if (!billingAccount && invoiceMetadata?.userId) {
      billingAccount = await this.billingRepo.findByUserId(
        invoiceMetadata.userId,
        tx,
      );
    }

    if (!billingAccount) {
      throw new Error(
        `BillingAccount not found for invoice.paid event ${eventId} (customer: ${customerId}, subscription: ${stripeSubscriptionId}). Will retry.`,
      );
    }

    // Link Stripe customer ID if not already set
    if (customerId && !billingAccount.stripeCustomerId) {
      await this.billingRepo.setStripeCustomerIdByAccountId(
        billingAccount.id,
        customerId,
        tx,
      );
    }

    // Resolve subscription plan
    let planId = existingSub?.planId;
    if (!planId) {
      const priceId =
        this.extractInvoicePriceId(invoice) ||
        subscriptionDetails?.items?.data?.[0]?.price?.id;
      if (priceId) {
        const plan = await this.billingRepo.findSubscriptionPlanByStripePriceId(
          priceId,
          tx,
        );
        if (plan) planId = plan.id;
      }
      if (!planId && invoiceMetadata?.planId) {
        planId = invoiceMetadata.planId;
      }
      if (!planId && subscriptionDetails?.metadata?.planId) {
        planId = subscriptionDetails.metadata.planId;
      }
    }

    // Record PaymentTransaction
    const amountPaid = invoice.amount_paid ? invoice.amount_paid / 100 : 0;
    const existingTx =
      await this.billingRepo.findPaymentTransactionByStripeEventId(eventId, tx);
    if (!existingTx) {
      await this.billingRepo.createPaymentTransaction(
        {
          billingAccountId: billingAccount.id,
          stripeEventId: eventId,
          stripeInvoiceId: invoice.id,
          idempotencyKey: `invoice:${invoice.id}`,
          type: TransactionType.ABONNEMENT,
          amount: amountPaid,
          currency: invoice.currency?.toUpperCase() ?? 'USD',
          status: TransactionStatus.REUSSI,
        },
        tx,
      );
    }

    // Update or Upsert Subscription record
    const periodStart = subscriptionDetails
      ? this.extractPeriodStart(subscriptionDetails)
      : this.extractInvoicePeriodStart(invoice);
    const periodEnd = subscriptionDetails
      ? this.extractPeriodEnd(subscriptionDetails)
      : this.extractInvoicePeriodEnd(invoice);

    if (stripeSubscriptionId && planId) {
      if (!periodStart || !periodEnd) {
        throw new Error(
          `Subscription period is missing for invoice.paid event ${eventId}. Will retry.`,
        );
      }

      await this.billingRepo.upsertSubscription(
        {
          billingAccountId: billingAccount.id,
          planId,
          stripeSubscriptionId,
          status: SubscriptionStatus.ACTIF,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          canceledAt: null, // Clear canceledAt on renewal if renewed
        },
        tx,
      );
    } else if (stripeSubscriptionId) {
      await this.billingRepo.updateSubscriptionStatus(
        stripeSubscriptionId,
        {
          status: SubscriptionStatus.ACTIF,
          ...(periodStart && { currentPeriodStart: periodStart }),
          ...(periodEnd && { currentPeriodEnd: periodEnd }),
          canceledAt: null,
        },
        tx,
      );
    }

    // Authoritative activation of BillingAccount to ABONNE
    await this.billingRepo.updateBillingAccountStatusById(
      billingAccount.id,
      BillingStatus.ABONNE,
      tx,
    );

    this.logger.log(
      `Recorded invoice.paid ($${amountPaid}) and activated BillingAccount ${billingAccount.id}`,
    );

    // Send confirmation email asynchronously (outside of DB lock)
    const user = await this.usersRepository.findById(billingAccount.userId);
    if (user) {
      this.notificationsService
        .sendPaymentConfirmationNotification(
          {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          {
            amount: amountPaid,
            currency: invoice.currency?.toUpperCase() ?? 'USD',
            type: 'Abonnement',
            invoiceId: invoice.id,
          },
        )
        .catch(() => {});
    }
  }

  /**
   * Handle invoice.payment_failed event.
   * Records failed transaction and moves subscription to PAST_DUE without immediately cutting off access.
   */
  private async handleInvoicePaymentFailed(
    eventId: string,
    invoice: Stripe.Invoice,
    tx: Prisma.TransactionClient,
  ) {
    const customerId = this.getStripeObjectId(invoice.customer);
    const stripeSubscriptionId = this.extractInvoiceSubscriptionId(invoice);
    const invoiceMetadata = this.extractInvoiceMetadata(invoice);

    let billingAccount;
    if (stripeSubscriptionId) {
      const sub = await this.billingRepo.findSubscriptionByStripeId(
        stripeSubscriptionId,
        tx,
      );
      if (sub) billingAccount = sub.billingAccount;
    }
    if (!billingAccount && customerId) {
      billingAccount =
        await this.billingRepo.findBillingAccountByStripeCustomerId(
          customerId,
          tx,
        );
    }
    if (!billingAccount && invoiceMetadata?.billingAccountId) {
      billingAccount = await this.billingRepo.findBillingAccountById(
        invoiceMetadata.billingAccountId,
        tx,
      );
    }
    if (!billingAccount && invoiceMetadata?.userId) {
      billingAccount = await this.billingRepo.findByUserId(
        invoiceMetadata.userId,
        tx,
      );
    }

    if (!billingAccount) {
      throw new Error(
        `BillingAccount not found for invoice.payment_failed event ${eventId} (customer: ${customerId}, subscription: ${stripeSubscriptionId}). Will retry.`,
      );
    }

    const amountDue = invoice.amount_due ? invoice.amount_due / 100 : 0;

    // Record failed payment transaction
    const existingTx =
      await this.billingRepo.findPaymentTransactionByStripeEventId(eventId, tx);
    if (!existingTx) {
      await this.billingRepo.createPaymentTransaction(
        {
          billingAccountId: billingAccount.id,
          stripeEventId: eventId,
          stripeInvoiceId: invoice.id,
          idempotencyKey: `invoice:${invoice.id}`,
          type: TransactionType.ABONNEMENT,
          amount: amountDue,
          currency: invoice.currency?.toUpperCase() ?? 'USD',
          status: TransactionStatus.ECHOUE,
        },
        tx,
      );
    }

    // Set Subscription to PAST_DUE (dunning phase)
    if (stripeSubscriptionId) {
      await this.billingRepo.updateSubscriptionStatus(
        stripeSubscriptionId,
        { status: SubscriptionStatus.IMPAYE },
        tx,
      );
    }

    // Keep BillingAccount status in grace period (ABONNE) until Stripe retries finish or subscription cancels
    this.logger.warn(
      `Invoice payment failed ($${amountDue}) for BillingAccount ${billingAccount.id}. Subscription marked PAST_DUE.`,
    );
  }

  /**
   * Handle customer.subscription.updated event.
   * Handles plan updates, period changes, out-of-order deliveries, and cancellation schedules.
   */
  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
    tx: Prisma.TransactionClient,
  ) {
    const customerId = this.getStripeObjectId(subscription.customer);
    let subRecord = await this.billingRepo.findSubscriptionByStripeId(
      subscription.id,
      tx,
    );

    const mappedStatus = this.mapStripeStatusToPrisma(subscription.status);
    const periodStart = this.extractPeriodStart(subscription);
    const periodEnd = this.extractPeriodEnd(subscription);
    const canceledAt = subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null;

    const priceId = subscription.items?.data?.[0]?.price?.id;
    let planId: string | undefined;
    if (priceId) {
      const plan = await this.billingRepo.findSubscriptionPlanByStripePriceId(
        priceId,
        tx,
      );
      if (plan) planId = plan.id;
    }

    // Out-of-order handling: If subRecord does not exist yet locally, resolve by customer and upsert
    if (!subRecord && customerId) {
      const billingAccount =
        await this.billingRepo.findBillingAccountByStripeCustomerId(
          customerId,
          tx,
        );
      if (billingAccount && planId) {
        if (!periodStart || !periodEnd) {
          throw new Error(
            `Subscription period is missing for subscription ${subscription.id}. Will retry.`,
          );
        }

        subRecord = (await this.billingRepo.upsertSubscription(
          {
            billingAccountId: billingAccount.id,
            planId,
            stripeSubscriptionId: subscription.id,
            status: mappedStatus,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            canceledAt,
          },
          tx,
        )) as any;
      }
    }

    if (!subRecord) {
      throw new Error(
        `Subscription ${subscription.id} could not be resolved or created during update event. Will retry.`,
      );
    }

    // Update subscription details
    await this.billingRepo.updateSubscriptionStatus(
      subscription.id,
      {
        status: mappedStatus,
        ...(periodStart && { currentPeriodStart: periodStart }),
        ...(periodEnd && { currentPeriodEnd: periodEnd }),
        canceledAt,
        ...(planId && { planId }),
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      },
      tx,
    );

    // Determine BillingAccount status
    let newBillingStatus: BillingStatus;
    if (mappedStatus === SubscriptionStatus.ACTIF) {
      newBillingStatus = BillingStatus.ABONNE;
    } else if (mappedStatus === SubscriptionStatus.IMPAYE) {
      // Grace period during dunning retries
      newBillingStatus = BillingStatus.ABONNE;
    } else if (
      mappedStatus === SubscriptionStatus.ANNULE ||
      mappedStatus === SubscriptionStatus.EXPIRE
    ) {
      // If period has ended, expire account; otherwise allow access until periodEnd
      if (periodEnd && periodEnd.getTime() > Date.now()) {
        newBillingStatus = BillingStatus.ABONNE;
      } else {
        newBillingStatus = BillingStatus.ABONNEMENT_EXPIRE;
      }
    } else {
      newBillingStatus = BillingStatus.ABONNEMENT_EXPIRE;
    }

    await this.billingRepo.updateBillingAccountStatusById(
      subRecord.billingAccountId,
      newBillingStatus,
      tx,
    );

    this.logger.log(
      `Updated subscription ${subscription.id} status to ${mappedStatus} (BillingStatus: ${newBillingStatus})`,
    );
  }

  /**
   * Handle customer.subscription.deleted event.
   * Final subscription termination when canceled or expired.
   */
  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
    tx: Prisma.TransactionClient,
  ) {
    const subRecord = await this.billingRepo.findSubscriptionByStripeId(
      subscription.id,
      tx,
    );
    if (!subRecord) {
      throw new Error(
        `Subscription ${subscription.id} not found in DB during delete event. Will retry.`,
      );
    }

    const canceledAt = subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : new Date();

    await this.billingRepo.updateSubscriptionStatus(
      subscription.id,
      {
        status: SubscriptionStatus.ANNULE,
        canceledAt,
        cancelAtPeriodEnd: false,
      },
      tx,
    );

    await this.billingRepo.updateBillingAccountStatusById(
      subRecord.billingAccountId,
      BillingStatus.ABONNEMENT_EXPIRE,
      tx,
    );

    this.logger.log(
      `Subscription ${subscription.id} marked as CANCELED. BillingAccount set to ABONNEMENT_EXPIRE.`,
    );
  }

  /**
   * Grants access for a $2 pay-as-you-go conversation only after Stripe has
   * confirmed its PaymentIntent. Checkout completion alone is not payment
   * confirmation, especially for delayed payment methods.
   */
  private async handleConversationPaymentSucceeded(
    eventId: string,
    paymentIntent: Stripe.PaymentIntent,
    tx: Prisma.TransactionClient,
  ) {
    const metadata = paymentIntent.metadata;
    const billingAccountId = metadata.billingAccountId;
    const listingId = metadata.listingId;
    const exporterCompanyId = metadata.exporterCompanyId;
    const importerCompanyId = metadata.importerCompanyId;

    // Ignore PaymentIntents that were not created for a conversation checkout.
    if (
      !billingAccountId ||
      !listingId ||
      !exporterCompanyId ||
      !importerCompanyId
    ) {
      return;
    }

    if (
      paymentIntent.status !== 'succeeded' ||
      paymentIntent.amount_received !== 200 ||
      paymentIntent.currency.toLowerCase() !== 'usd'
    ) {
      throw new Error(
        `Invalid conversation payment ${paymentIntent.id}: expected a succeeded 200 USD PaymentIntent.`,
      );
    }

    const billingAccount = await this.billingRepo.findBillingAccountById(
      billingAccountId,
      tx,
    );
    if (!billingAccount) {
      throw new Error(
        `BillingAccount ${billingAccountId} was not found for PaymentIntent ${paymentIntent.id}. Will retry.`,
      );
    }

    const customerId = this.getStripeObjectId(paymentIntent.customer);
    if (
      customerId &&
      billingAccount.stripeCustomerId &&
      billingAccount.stripeCustomerId !== customerId
    ) {
      throw new Error(
        `Stripe customer mismatch for PaymentIntent ${paymentIntent.id}. Will retry.`,
      );
    }

    await this.billingRepo.recordPaidConversation(
      {
        billingAccountId,
        listingId,
        exporterCompanyId,
        importerCompanyId,
        stripePaymentIntentId: paymentIntent.id,
        stripeEventId: eventId,
        amount: paymentIntent.amount_received / 100,
        currency: paymentIntent.currency,
      },
      tx,
    );

    // Send payment confirmation email asynchronously
    const user = await this.usersRepository.findById(billingAccount.userId);
    if (user) {
      this.notificationsService
        .sendPaymentConfirmationNotification(
          {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          {
            amount: paymentIntent.amount_received / 100,
            currency: paymentIntent.currency?.toUpperCase() ?? 'USD',
            type: "Conversation à l'usage",
            paymentIntentId: paymentIntent.id,
          },
        )
        .catch(() => {});
    }
  }

  private mapStripeStatusToPrisma(
    stripeStatus: Stripe.Subscription.Status,
  ): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
      case 'trialing':
        return SubscriptionStatus.ACTIF;
      case 'canceled':
        return SubscriptionStatus.ANNULE;
      case 'past_due':
        return SubscriptionStatus.IMPAYE;
      case 'incomplete':
      case 'unpaid':
      case 'incomplete_expired':
      case 'paused':
        return SubscriptionStatus.EXPIRE;
      default:
        return SubscriptionStatus.EXPIRE;
    }
  }

  private extractPeriodEnd(subscription: Stripe.Subscription): Date | null {
    const itemPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
    if (typeof itemPeriodEnd === 'number') {
      return new Date(itemPeriodEnd * 1000);
    }
    const topLevel = (subscription as any).current_period_end;
    if (typeof topLevel === 'number') {
      return new Date(topLevel * 1000);
    }
    return null;
  }

  private extractPeriodStart(subscription: Stripe.Subscription): Date | null {
    const itemPeriodStart = subscription.items?.data?.[0]?.current_period_start;
    if (typeof itemPeriodStart === 'number') {
      return new Date(itemPeriodStart * 1000);
    }
    const topLevel = (subscription as any).current_period_start;
    if (typeof topLevel === 'number') {
      return new Date(topLevel * 1000);
    }
    return null;
  }

  private extractInvoicePeriodEnd(invoice: Stripe.Invoice): Date | null {
    const lineEnd = invoice.lines?.data?.[0]?.period?.end;
    if (typeof lineEnd === 'number') {
      return new Date(lineEnd * 1000);
    }
    const topEnd = invoice.period_end;
    if (typeof topEnd === 'number') {
      return new Date(topEnd * 1000);
    }
    return null;
  }

  private extractInvoicePeriodStart(invoice: Stripe.Invoice): Date | null {
    const lineStart = invoice.lines?.data?.[0]?.period?.start;
    if (typeof lineStart === 'number') {
      return new Date(lineStart * 1000);
    }
    const topStart = invoice.period_start;
    if (typeof topStart === 'number') {
      return new Date(topStart * 1000);
    }
    return null;
  }

  private extractInvoiceSubscriptionId(
    invoice: Stripe.Invoice,
  ): string | undefined {
    // 1. Stripe 2025/2026+ (Dahlia and newer API versions): parent.subscription_details.subscription
    const parentSub = (invoice as any).parent?.subscription_details?.subscription;
    if (parentSub) {
      return typeof parentSub === 'string' ? parentSub : parentSub.id;
    }

    // 2. Legacy top-level subscription field
    const legacySub = (invoice as any).subscription;
    if (legacySub) {
      return typeof legacySub === 'string' ? legacySub : legacySub.id;
    }

    // 3. Fallback: Line items subscription reference
    const lineSub = (invoice.lines?.data?.[0] as any)?.subscription;
    if (lineSub) {
      return typeof lineSub === 'string' ? lineSub : lineSub.id;
    }

    const subItemSub = (invoice.lines?.data?.[0] as any)?.parent
      ?.subscription_item_details?.subscription;
    if (subItemSub) {
      return typeof subItemSub === 'string' ? subItemSub : subItemSub.id;
    }

    return undefined;
  }

  private extractInvoicePriceId(invoice: Stripe.Invoice): string | undefined {
    const firstLine = invoice.lines?.data?.[0] as any;
    if (!firstLine) return undefined;

    // 1. Stripe 2025/2026+ API: line.pricing.price_details.price
    const pricingPrice = firstLine.pricing?.price_details?.price;
    if (pricingPrice) {
      return typeof pricingPrice === 'string' ? pricingPrice : pricingPrice.id;
    }

    // 2. Pricing.price fallback
    const legacyPricing = firstLine.pricing?.price;
    if (legacyPricing) {
      return typeof legacyPricing === 'string'
        ? legacyPricing
        : legacyPricing.id;
    }

    // 3. Legacy top-level line.price
    const linePrice = firstLine.price;
    if (linePrice) {
      return typeof linePrice === 'string' ? linePrice : linePrice.id;
    }

    return undefined;
  }

  private extractInvoiceMetadata(
    invoice: Stripe.Invoice,
  ): Stripe.Metadata | undefined {
    return (
      (invoice as any).parent?.subscription_details?.metadata ||
      (invoice as any).subscription_details?.metadata ||
      invoice.lines?.data?.[0]?.metadata ||
      invoice.metadata ||
      undefined
    );
  }

  private getStripeObjectId(
    value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
  ): string | undefined {
    return typeof value === 'string' ? value : value?.id;
  }
}
