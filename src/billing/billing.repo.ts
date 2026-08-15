import { Injectable } from '@nestjs/common';
import {
  BillingStatus,
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
    status: BillingStatus | string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.billingAccount.update({
      where: { userId },
      data: { status: status as BillingStatus },
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
      data: { status },
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
    status: BillingStatus | string = BillingStatus.GRATUIT,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.billingAccount.create({
      data: { userId, status: status as BillingStatus },
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
      stripeEventId: string;
      type: TransactionType;
      amount: number | Prisma.Decimal;
      status: TransactionStatus;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.paymentTransaction.create({
      data: {
        billingAccountId: data.billingAccountId,
        stripeEventId: data.stripeEventId,
        type: data.type,
        amount: data.amount,
        status: data.status,
      },
    });
  }

  async upsertSubscription(
    data: {
      billingAccountId: string;
      planId: string;
      stripeSubscriptionId: string;
      status: SubscriptionStatus;
      currentPeriodEnd?: Date | null;
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
        currentPeriodEnd: data.currentPeriodEnd,
        canceledAt: data.canceledAt,
      },
      update: {
        planId: data.planId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status,
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
      currentPeriodEnd?: Date | null;
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
        ...(data.currentPeriodEnd !== undefined && {
          currentPeriodEnd: data.currentPeriodEnd,
        }),
        ...(data.canceledAt !== undefined && { canceledAt: data.canceledAt }),
      },
    });
  }
}
