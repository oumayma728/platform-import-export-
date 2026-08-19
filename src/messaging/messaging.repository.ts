import { Injectable } from '@nestjs/common';
import {
  BillingStatus,
  ConversationAccessSource,
  ConversationStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly listingSummarySelect = {
    id: true,
    title: true,
    type: true,
    price: true,
    currency: true,
  } satisfies Prisma.ListingSelect;

  private readonly listingDetailsSelect = {
    ...this.listingSummarySelect,
    status: true,
  } satisfies Prisma.ListingSelect;

  private readonly companySummarySelect = {
    id: true,
    name: true,
    logoUrl: true,
  } satisfies Prisma.CompanySelect;

  private readonly companyDetailsSelect = {
    ...this.companySummarySelect,
    country: true,
  } satisfies Prisma.CompanySelect;

  private readonly senderSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
  } satisfies Prisma.UserSelect;

  private readonly conversationSummaryInclude = {
    listing: { select: this.listingSummarySelect },
    exporterCompany: { select: this.companySummarySelect },
    importerCompany: { select: this.companySummarySelect },
  } satisfies Prisma.ConversationInclude;

  private readonly conversationDetailsInclude = {
    listing: { select: this.listingDetailsSelect },
    exporterCompany: { select: this.companyDetailsSelect },
    importerCompany: { select: this.companyDetailsSelect },
    messages: {
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: this.senderSelect } },
    },
  } satisfies Prisma.ConversationInclude;

  private authorizedConversationWhere(
    conversationId: string,
    companyId: string,
  ): Prisma.ConversationWhereInput {
    return {
      id: conversationId,
      OR: [{ exporterCompanyId: companyId }, { importerCompanyId: companyId }],
    };
  }

  async findAuthorizedConversation(conversationId: string, companyId: string) {
    return this.prisma.conversation.findFirst({
      where: this.authorizedConversationWhere(conversationId, companyId),
      select: { id: true },
    });
  }

  async findAuthorizedConversationDetails(
    conversationId: string,
    companyId: string,
  ) {
    return this.prisma.conversation.findFirst({
      where: this.authorizedConversationWhere(conversationId, companyId),
      include: this.conversationDetailsInclude,
    });
  }

  async findAuthorizedConversationMessages(
    conversationId: string,
    companyId: string,
    take: number,
    cursor?: string,
  ) {
    return this.prisma.conversation.findFirst({
      where: this.authorizedConversationWhere(conversationId, companyId),
      select: {
        messages: {
          cursor: cursor ? { id: cursor } : undefined,
          skip: cursor ? 1 : 0,
          take,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          include: { sender: { select: this.senderSelect } },
        },
      },
    });
  }

  async findConversationByListing(
    listingId: string,
    exporterCompanyId: string,
    importerCompanyId: string,
  ) {
    return this.prisma.conversation.findUnique({
      where: {
        listingId_exporterCompanyId_importerCompanyId: {
          listingId,
          exporterCompanyId,
          importerCompanyId,
        },
      },
      include: this.conversationSummaryInclude,
    });
  }

  async findUserConversations(companyId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [
          { exporterCompanyId: companyId },
          { importerCompanyId: companyId },
        ],
      },
      include: {
        listing: { select: this.listingDetailsSelect },
        exporterCompany: { select: this.companyDetailsSelect },
        importerCompany: { select: this.companyDetailsSelect },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            senderId: true,
            content: true,
            attachmentUrl: true,
            createdAt: true,
            isRead: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createSuggestedConversation(
    conversation: Prisma.ConversationUncheckedCreateInput,
  ) {
    return this.prisma.conversation.create({
      data: {
        ...conversation,
        status: ConversationStatus.SUGGEREE,
      },
      include: this.conversationSummaryInclude,
    });
  }

  async createConversationWithAccess(input: {
    listingId: string;
    exporterCompanyId: string;
    importerCompanyId: string;
    billingAccountId: string;
    source: ConversationAccessSource;
  }) {
    const execute = async (tx: Prisma.TransactionClient) => {
      const conversationWhere = {
        listingId_exporterCompanyId_importerCompanyId: {
          listingId: input.listingId,
          exporterCompanyId: input.exporterCompanyId,
          importerCompanyId: input.importerCompanyId,
        },
      };

      const existingConversation = await tx.conversation.findUnique({
        where: conversationWhere,
        include: this.conversationSummaryInclude,
      });
      if (existingConversation) {
        return {
          kind: 'existing' as const,
          conversation: existingConversation,
        };
      }

      if (input.source === ConversationAccessSource.GRATUIT) {
        const quotaUpdate = await tx.billingAccount.updateMany({
          where: {
            id: input.billingAccountId,
            freeChatsUsed: { lt: 50 },
          },
          data: { freeChatsUsed: { increment: 1 } },
        });

        if (quotaUpdate.count === 0) {
          const billingAccount = await tx.billingAccount.findUnique({
            where: { id: input.billingAccountId },
            select: { freeChatsUsed: true },
          });

          if (billingAccount) {
            await tx.billingAccount.update({
              where: { id: input.billingAccountId },
              data: { billingStatus: BillingStatus.LIMITE_ATTEINTE },
            });
          }

          return {
            kind: 'quota_exhausted' as const,
            freeChatsUsed: billingAccount?.freeChatsUsed ?? 50,
          };
        }
      }

      const conversation = await tx.conversation.create({
        data: {
          listingId: input.listingId,
          exporterCompanyId: input.exporterCompanyId,
          importerCompanyId: input.importerCompanyId,
          status: ConversationStatus.SUGGEREE,
        },
        include: this.conversationSummaryInclude,
      });

      await tx.conversationAccess.create({
        data: {
          billingAccountId: input.billingAccountId,
          conversationId: conversation.id,
          source: input.source,
          amount: 0,
        },
      });

      if (input.source === ConversationAccessSource.GRATUIT) {
        await tx.billingAccount.updateMany({
          where: {
            id: input.billingAccountId,
            freeChatsUsed: { gte: 50 },
          },
          data: { billingStatus: BillingStatus.LIMITE_ATTEINTE },
        });
      }

      return { kind: 'created' as const, conversation };
    };

    try {
      return await this.prisma.$transaction(execute);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existingConversation = await this.findConversationByListing(
          input.listingId,
          input.exporterCompanyId,
          input.importerCompanyId,
        );
        if (existingConversation) {
          return {
            kind: 'existing' as const,
            conversation: existingConversation,
          };
        }
      }

      throw error;
    }
  }

  async createMessageAndStartContact(
    data: Prisma.MessageUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const execute = async (prismaTx: Prisma.TransactionClient) => {
      // Conversation access is granted during conversation creation. Messages
      // must never consume the user's conversation quota.
      const message = await prismaTx.message.create({
        data,
        include: { sender: { select: this.senderSelect } },
      });

      // Update conversation status inside the same transaction.
      await prismaTx.conversation.updateMany({
        where: {
          id: data.conversationId,
          status: {
            in: [ConversationStatus.SUGGEREE, ConversationStatus.CONSULTEE],
          },
        },
        data: { status: ConversationStatus.EN_CONTACT },
      });

      return message;
    };

    if (tx) {
      return execute(tx);
    }

    return this.prisma.$transaction(execute);
  }

  async updateConversationStatus(
    conversationId: string,
    status: ConversationStatus,
  ) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
      include: this.conversationSummaryInclude,
    });
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.conversation.updateMany({
        where: { id: conversationId, status: ConversationStatus.SUGGEREE },
        data: { status: ConversationStatus.CONSULTEE },
      });

      return tx.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      });
    });
  }
}
