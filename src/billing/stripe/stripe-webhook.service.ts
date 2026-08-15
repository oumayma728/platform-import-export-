import { Injectable, Logger } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { BillingRepository } from '../billing.repo';
import { PrismaService } from '../../prisma/prisma.service';
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
  ) {}

  /**
   * Main entry point to process verified Stripe Webhook events idempotently.
   */
  async handleWebhookEvent(
    rawBody: Buffer | string,
    signature: string,
  ): Promise<{ received: boolean; duplicate?: boolean }> {
    const event = this.stripeService.constructEventFromPayload(rawBody, signature);
    this.logger.log(`Processing Stripe event [${event.id}] of type: ${event.type}`);

    // Quick idempotency check before any work
    const alreadyProcessed = await this.billingRepo.isWebhookEventProcessed(event.id);
    if (alreadyProcessed) {
      this.logger.log(`Event [${event.id}] was already processed. Skipping.`);
      return { received: true, duplicate: true };
    }

    // Step 1: External Stripe API calls executed OUTSIDE database transactions
    let subscriptionDetails: Stripe.Subscription | null = null;
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription' && session.subscription) {
        const subId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
        try {
          subscriptionDetails = await this.stripeService.getSubscription(subId);
        } catch (err: any) {
          this.logger.warn(`Could not pre-fetch subscription ${subId} from Stripe: ${err.message}`);
        }
      }
    } else if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof (invoice as any).subscription === 'string'
        ? (invoice as any).subscription
        : (invoice as any).subscription?.id;
      if (subId) {
        try {
          subscriptionDetails = await this.stripeService.getSubscription(subId);
        } catch (err: any) {
          this.logger.warn(`Could not pre-fetch subscription ${subId} from Stripe: ${err.message}`);
        }
      }
    }

    // Step 2: Atomic database operations within a bounded transaction
    const result = await this.prismaService.$transaction(async (tx) => {
      // Atomic deduplication lock inside transaction
      const recorded = await this.billingRepo.recordWebhookEvent(event.id, event.type, tx);
      if (!recorded) {
        this.logger.log(`Event [${event.id}] duplicate detected during insertion. Skipping.`);
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
    const customerId = session.customer as string;
    const stripeSubscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

    // Resolve BillingAccount by ID first, then by customer ID, then by user ID
    let billingAccount;
    if (billingAccountId) {
      billingAccount = await this.billingRepo.findBillingAccountById(billingAccountId, tx);
    }
    if (!billingAccount && customerId) {
      billingAccount = await this.billingRepo.findBillingAccountByStripeCustomerId(customerId, tx);
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
      await this.billingRepo.setStripeCustomerIdByAccountId(billingAccount.id, customerId, tx);
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
    const customerId = invoice.customer as string;
    const stripeSubscriptionId = typeof (invoice as any).subscription === 'string'
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id;

    let billingAccount;
    let existingSub: Awaited<ReturnType<BillingRepository['findSubscriptionByStripeId']>> = null;

    if (stripeSubscriptionId) {
      existingSub = await this.billingRepo.findSubscriptionByStripeId(stripeSubscriptionId, tx);
      if (existingSub) {
        billingAccount = existingSub.billingAccount;
      }
    }

    if (!billingAccount && customerId) {
      billingAccount = await this.billingRepo.findBillingAccountByStripeCustomerId(customerId, tx);
    }

    if (!billingAccount) {
      throw new Error(
        `BillingAccount not found for invoice.paid event ${eventId} (customer: ${customerId}, subscription: ${stripeSubscriptionId}). Will retry.`,
      );
    }

    // Resolve subscription plan
    let planId = existingSub?.planId;
    if (!planId) {
      const priceId =
        (invoice.lines?.data?.[0] as any)?.pricing?.price?.id ||
        (invoice.lines?.data?.[0] as any)?.price?.id ||
        subscriptionDetails?.items?.data?.[0]?.price?.id;
      if (priceId) {
        const plan = await this.billingRepo.findSubscriptionPlanByStripePriceId(priceId, tx);
        if (plan) planId = plan.id;
      }
      if (!planId && subscriptionDetails?.metadata?.planId) {
        planId = subscriptionDetails.metadata.planId;
      }
    }

    // Record PaymentTransaction
    const amountPaid = invoice.amount_paid ? invoice.amount_paid / 100 : 0;
    const existingTx = await this.billingRepo.findPaymentTransactionByStripeEventId(eventId, tx);
    if (!existingTx) {
      await this.billingRepo.createPaymentTransaction(
        {
          billingAccountId: billingAccount.id,
          stripeEventId: eventId,
          type: TransactionType.ABONNEMENT,
          amount: amountPaid,
          status: TransactionStatus.REUSSI,
        },
        tx,
      );
    }

    // Update or Upsert Subscription record
    const periodEnd = subscriptionDetails
      ? this.extractPeriodEnd(subscriptionDetails)
      : this.extractInvoicePeriodEnd(invoice);

    if (stripeSubscriptionId && planId) {
      await this.billingRepo.upsertSubscription(
        {
          billingAccountId: billingAccount.id,
          planId,
          stripeSubscriptionId,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: periodEnd,
          canceledAt: null, // Clear canceledAt on renewal if renewed
        },
        tx,
      );
    } else if (stripeSubscriptionId) {
      await this.billingRepo.updateSubscriptionStatus(
        stripeSubscriptionId,
        {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: periodEnd,
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
    const customerId = invoice.customer as string;
    const stripeSubscriptionId = typeof (invoice as any).subscription === 'string'
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id;

    let billingAccount;
    if (stripeSubscriptionId) {
      const sub = await this.billingRepo.findSubscriptionByStripeId(stripeSubscriptionId, tx);
      if (sub) billingAccount = sub.billingAccount;
    }
    if (!billingAccount && customerId) {
      billingAccount = await this.billingRepo.findBillingAccountByStripeCustomerId(customerId, tx);
    }

    if (!billingAccount) {
      throw new Error(
        `BillingAccount not found for invoice.payment_failed event ${eventId} (customer: ${customerId}, subscription: ${stripeSubscriptionId}). Will retry.`,
      );
    }

    const amountDue = invoice.amount_due ? invoice.amount_due / 100 : 0;

    // Record failed payment transaction
    const existingTx = await this.billingRepo.findPaymentTransactionByStripeEventId(eventId, tx);
    if (!existingTx) {
      await this.billingRepo.createPaymentTransaction(
        {
          billingAccountId: billingAccount.id,
          stripeEventId: eventId,
          type: TransactionType.ABONNEMENT,
          amount: amountDue,
          status: TransactionStatus.ECHOUE,
        },
        tx,
      );
    }

    // Set Subscription to PAST_DUE (dunning phase)
    if (stripeSubscriptionId) {
      await this.billingRepo.updateSubscriptionStatus(
        stripeSubscriptionId,
        { status: SubscriptionStatus.PAST_DUE },
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
    const customerId = subscription.customer as string;
    let subRecord = await this.billingRepo.findSubscriptionByStripeId(subscription.id, tx);

    const mappedStatus = this.mapStripeStatusToPrisma(subscription.status);
    const periodEnd = this.extractPeriodEnd(subscription);
    const canceledAt = subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null;

    const priceId = subscription.items?.data?.[0]?.price?.id;
    let planId: string | undefined;
    if (priceId) {
      const plan = await this.billingRepo.findSubscriptionPlanByStripePriceId(priceId, tx);
      if (plan) planId = plan.id;
    }

    // Out-of-order handling: If subRecord does not exist yet locally, resolve by customer and upsert
    if (!subRecord && customerId) {
      const billingAccount = await this.billingRepo.findBillingAccountByStripeCustomerId(customerId, tx);
      if (billingAccount && planId) {
        subRecord = (await this.billingRepo.upsertSubscription(
          {
            billingAccountId: billingAccount.id,
            planId,
            stripeSubscriptionId: subscription.id,
            status: mappedStatus,
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
        currentPeriodEnd: periodEnd,
        canceledAt,
        ...(planId && { planId }),
      },
      tx,
    );

    // Determine BillingAccount status
    let newBillingStatus: BillingStatus;
    if (mappedStatus === SubscriptionStatus.ACTIVE) {
      newBillingStatus = BillingStatus.ABONNE;
    } else if (mappedStatus === SubscriptionStatus.PAST_DUE) {
      // Grace period during dunning retries
      newBillingStatus = BillingStatus.ABONNE;
    } else if (mappedStatus === SubscriptionStatus.CANCELED || mappedStatus === SubscriptionStatus.EXPIRED) {
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
    const subRecord = await this.billingRepo.findSubscriptionByStripeId(subscription.id, tx);
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
        status: SubscriptionStatus.CANCELED,
        canceledAt,
      },
      tx,
    );

    await this.billingRepo.updateBillingAccountStatusById(
      subRecord.billingAccountId,
      BillingStatus.ABONNEMENT_EXPIRE,
      tx,
    );

    this.logger.log(`Subscription ${subscription.id} marked as CANCELED. BillingAccount set to ABONNEMENT_EXPIRE.`);
  }

  private mapStripeStatusToPrisma(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      case 'past_due':
        return SubscriptionStatus.PAST_DUE;
      case 'unpaid':
      case 'incomplete_expired':
        return SubscriptionStatus.EXPIRED;
      default:
        return SubscriptionStatus.ACTIVE;
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

  private extractInvoicePeriodEnd(invoice: Stripe.Invoice): Date | null {
    const lineEnd = invoice.lines?.data?.[0]?.period?.end;
    if (typeof lineEnd === 'number') {
      return new Date(lineEnd * 1000);
    }
    return null;
  }
}