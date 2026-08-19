import { Injectable } from '@nestjs/common';
import {
  BillingStatus,
  ConversationAccessSource,
  ConversationStatus,
  SubscriptionStatus,
  TransactionStatus,
  TransactionType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveSubscriptionPlanById(
    id: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.subscriptionPlan.findFirst({
      where: { id, isActive: true },
    });
  }

  async findSubscriptionPlanByStripePriceId(
    stripePriceId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.subscriptionPlan.findFirst({
      where: { stripePriceId, isActive: true },
    });
  }

  async findBillingAccount(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.billingAccount.findUnique({
      where: { userId },
      include: { subscription: true },
    });
  }

  async findBillingAccountById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.billingAccount.findUnique({
      where: { id },
      include: { subscription: true },
    });
  }

  async findBillingAccountByStripeCustomerId(
    stripeCustomerId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.billingAccount.findUnique({
      where: { stripeCustomerId },
      include: { subscription: true },
    });
  }

  async incrementFreeChats(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.billingAccount.update({
      where: { userId },
      data: { freeChatsUsed: { increment: 1 } },
    });
  }

  async updateBillingStatus(
    userId: string,
    billingStatus: BillingStatus = BillingStatus.GRATUIT,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.billingAccount.update({
      where: { userId },
      data: { billingStatus },
    });
  }

  async updateBillingAccountStatusById(
    billingAccountId: string,
    status: BillingStatus,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.billingAccount.update({
      where: { id: billingAccountId },
      data: { billingStatus: status },
    });
  }

  async findByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.billingAccount.findUnique({
      where: { userId },
      include: { subscription: true },
    });
  }

  async createBillingAccount(
    userId: string,
    billingStatus: BillingStatus = BillingStatus.GRATUIT,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.billingAccount.create({
      data: { userId, billingStatus },
      include: { subscription: true },
    });
  }

  async setStripeCustomerIdByUserId(
    userId: string,
    customerId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.billingAccount.update({
      where: { userId },
      data: { stripeCustomerId: customerId },
    });
  }

  async setStripeCustomerIdByAccountId(
    billingAccountId: string,
    customerId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.billingAccount.update({
      where: { id: billingAccountId },
      data: { stripeCustomerId: customerId },
    });
  }

  async isWebhookEventProcessed(
    eventId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx ?? this.prisma;
    const existing = await client.processedWebhookEvent.findUnique({
      where: { eventId },
    });
    return !!existing;
  }

  async recordWebhookEvent(
    eventId: string,
    eventType: string,
    tx?: Prisma.TransactionClient,
  ): Promise<boolean> {
    const client = tx ?? this.prisma;
    try {
      await client.processedWebhookEvent.create({
        data: {
          eventId,
          eventType,
        },
      });
      return true;
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }

  async findPaymentTransactionByStripeEventId(
    stripeEventId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.paymentTransaction.findUnique({
      where: { stripeEventId },
    });
  }

  async createPaymentTransaction(
    data: {
      billingAccountId: string;
      stripeEventId?: string;
      stripePaymentIntentId?: string;
      stripeInvoiceId?: string;
      idempotencyKey?: string;
      type: TransactionType;
      amount: number | Prisma.Decimal;
      currency?: string;
      status: TransactionStatus;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.paymentTransaction.create({
      data: {
        billingAccountId: data.billingAccountId,
        stripeEventId: data.stripeEventId,
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeInvoiceId: data.stripeInvoiceId,
        idempotencyKey: data.idempotencyKey,
        type: data.type,
        amount: data.amount,
        currency: data.currency ?? 'USD',
        status: data.status,
      },
    });
  }

  async findPaymentTransactionByStripePaymentIntentId(
    stripePaymentIntentId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.paymentTransaction.findUnique({
      where: { stripePaymentIntentId },
    });
  }

  async ensureBillingAccount(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.billingAccount.upsert({
      where: { userId },
      create: { userId, billingStatus: BillingStatus.GRATUIT },
      update: {},
      include: { subscription: true },
    });
  }

  async upsertSubscription(
    data: {
      billingAccountId: string;
      planId: string;
      stripeSubscriptionId: string;
      status: SubscriptionStatus;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      canceledAt?: Date | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.subscription.upsert({
      where: { billingAccountId: data.billingAccountId },
      create: {
        billingAccountId: data.billingAccountId,
        planId: data.planId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        canceledAt: data.canceledAt,
      },
      update: {
        planId: data.planId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        canceledAt: data.canceledAt,
      },
    });
  }

  async findSubscriptionByStripeId(
    stripeSubscriptionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.subscription.findUnique({
      where: { stripeSubscriptionId },
      include: { billingAccount: true, plan: true },
    });
  }

  async updateSubscriptionStatus(
    stripeSubscriptionId: string,
    data: {
      status: SubscriptionStatus;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      canceledAt?: Date | null;
      planId?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status: data.status,
        ...(data.planId !== undefined && { planId: data.planId }),
        ...(data.currentPeriodStart !== undefined && {
          currentPeriodStart: data.currentPeriodStart,
        }),
        ...(data.currentPeriodEnd !== undefined && {
          currentPeriodEnd: data.currentPeriodEnd,
        }),
        ...(data.canceledAt !== undefined && { canceledAt: data.canceledAt }),
      },
    });
  }

  async recordPaidConversation(
    data: {
      billingAccountId: string;
      listingId: string;
      exporterCompanyId: string;
      importerCompanyId: string;
      stripePaymentIntentId: string;
      stripeEventId: string;
      amount: number | Prisma.Decimal;
      currency: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;

    const conversation = await client.conversation.upsert({
      where: {
        listingId_exporterCompanyId_importerCompanyId: {
          listingId: data.listingId,
          exporterCompanyId: data.exporterCompanyId,
          importerCompanyId: data.importerCompanyId,
        },
      },
      create: {
        listingId: data.listingId,
        exporterCompanyId: data.exporterCompanyId,
        importerCompanyId: data.importerCompanyId,
        status: ConversationStatus.SUGGEREE,
      },
      update: {},
    });

    await client.conversationAccess.upsert({
      where: {
        billingAccountId_conversationId: {
          billingAccountId: data.billingAccountId,
          conversationId: conversation.id,
        },
      },
      create: {
        billingAccountId: data.billingAccountId,
        conversationId: conversation.id,
        source: ConversationAccessSource.PAIEMENT_A_L_USAGE,
        amount: data.amount,
      },
      update: {},
    });

    const existingTransaction =
      await this.findPaymentTransactionByStripePaymentIntentId(
        data.stripePaymentIntentId,
        tx,
      );

    if (!existingTransaction) {
      await this.createPaymentTransaction(
        {
          billingAccountId: data.billingAccountId,
          stripeEventId: data.stripeEventId,
          stripePaymentIntentId: data.stripePaymentIntentId,
          idempotencyKey: `payment-intent:${data.stripePaymentIntentId}`,
          type: TransactionType.PAIEMENT_USAGE,
          amount: data.amount,
          currency: data.currency.toUpperCase(),
          status: TransactionStatus.REUSSI,
        },
        tx,
      );

      await client.billingAccount.update({
        where: { id: data.billingAccountId },
        data: {
          billingStatus: BillingStatus.PAIEMENT_USAGE,
          cumulativeUsageSpend: { increment: data.amount },
        },
      });
    }

    return conversation;
  }
}
