import { Injectable } from '@nestjs/common';
import { ConversationStatus, Prisma } from '@prisma/client';

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

  // condition to find a conversation where the user is either the exporter or importer company
  private authorizedConversationWhere(
    conversationId: string,
    companyId: string,
  ): Prisma.ConversationWhereInput {
    return {
      id: conversationId,
      OR: [{ exporterCompanyId: companyId }, { importerCompanyId: companyId }],
    };
  }

  // Queries

  // check if the conversation is valid or no
  async findAuthorizedConversation(conversationId: string, companyId: string) {
    return this.prisma.conversation.findFirst({
      where: this.authorizedConversationWhere(conversationId, companyId),
      select: { id: true },
    });
  }

  // the next 2 functions will get conversations with different results (depends on what u need: messages, infos)
  // get infos about the conversation
  async findAuthorizedConversationDetails(
    conversationId: string,
    companyId: string,
  ) {
    return this.prisma.conversation.findFirst({
      where: this.authorizedConversationWhere(conversationId, companyId),
      include: this.conversationDetailsInclude,
    });
  }

  // get messages from a conversation
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

  async createConversationWithMessage(
    conversation: Prisma.ConversationUncheckedCreateInput,
    message: Omit<Prisma.MessageUncheckedCreateInput, 'conversationId'>,
  ) {
    return this.prisma.conversation.create({
      data: {
        ...conversation,
        status: ConversationStatus.CONSULTEE,
        messages: { create: message },
      },
      include: this.conversationSummaryInclude,
    });
  }

  async createMessageAndPromoteContact(
    data: Prisma.MessageUncheckedCreateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data,
        include: { sender: { select: this.senderSelect } },
      });

      await tx.conversation.updateMany({
        where: {
          id: data.conversationId,
          status: ConversationStatus.CONSULTEE,
          messages: { some: { senderId: { not: data.senderId } } },
        },
        data: { status: ConversationStatus.EN_CONTACT },
      });

      return message;
    });
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
      const result = await tx.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      });

      if (result.count > 0) {
        await tx.conversation.updateMany({
          where: { id: conversationId, status: ConversationStatus.SUGGEREE },
          data: { status: ConversationStatus.CONSULTEE },
        });
      }

      return result;
    });
  }
}
