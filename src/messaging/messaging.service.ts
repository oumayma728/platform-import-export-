import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ListingType } from '@prisma/client';

import { ListingsRepository } from '../listings/listings.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetConversationMessagesQueryDto } from './dto/get-conversation-messages-query.dto';
import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto';
import { MessagingRepository } from './messaging.repository';

@Injectable()
export class MessagingService {
  constructor(
    private readonly messagingRepository: MessagingRepository,
    private readonly listingsRepository: ListingsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  private async getUserCompanyId(userId: string): Promise<string> {
    const companyId = await this.usersRepository.getUserCompanyId(userId);

    if (!companyId) {
      throw new BadRequestException(
        'User must be associated with a registered company to access conversations.',
      );
    }

    return companyId;
  }

  private async findAuthorizedConversation<T>(
    conversationId: string,
    userId: string,
    findConversation: (companyId: string) => Promise<T | null>,
  ): Promise<T> {
    const companyId = await this.getUserCompanyId(userId);
    const conversation = await findConversation(companyId);

    if (!conversation) {
      // Do not reveal whether an inaccessible conversation exists.
      throw new ForbiddenException(
        'You are not authorized to access this conversation.',
      );
    }

    return conversation;
  }

  private getAuthorizedConversation(conversationId: string, userId: string) {
    return this.findAuthorizedConversation(
      conversationId,
      userId,
      (companyId) =>
        this.messagingRepository.findAuthorizedConversation(
          conversationId,
          companyId,
        ),
    );
  }

  private getAuthorizedConversationDetails(
    conversationId: string,
    userId: string,
  ) {
    return this.findAuthorizedConversation(
      conversationId,
      userId,
      (companyId) =>
        this.messagingRepository.findAuthorizedConversationDetails(
          conversationId,
          companyId,
        ),
    );
  }

  private getAuthorizedConversationMessages(
    conversationId: string,
    userId: string,
    query: GetConversationMessagesQueryDto,
  ) {
    return this.findAuthorizedConversation(
      conversationId,
      userId,
      (companyId) =>
        this.messagingRepository.findAuthorizedConversationMessages(
          conversationId,
          companyId,
          query.limit + 1,
          query.cursor,
        ),
    );
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    const companyId = await this.getUserCompanyId(userId);
    const listing = await this.listingsRepository.findOne(dto.listingId);

    if (!listing) {
      throw new NotFoundException('Target listing not found.');
    }

    if (listing.companyId === companyId) {
      throw new BadRequestException(
        'You cannot initiate a conversation on your own listing.',
      );
    }

    const [exporterCompanyId, importerCompanyId] =
      listing.type === ListingType.OFFRE
        ? [listing.companyId, companyId]
        : [companyId, listing.companyId];

    const existingConversation =
      await this.messagingRepository.findConversationByListing(
        dto.listingId,
        exporterCompanyId,
        importerCompanyId,
      );

    if (existingConversation) {
      return existingConversation;
    }

    return this.messagingRepository.createSuggestedConversation({
      listingId: dto.listingId,
      exporterCompanyId,
      importerCompanyId,
    });
  }

  async getUserConversations(userId: string) {
    const companyId = await this.getUserCompanyId(userId);
    const conversations =
      await this.messagingRepository.findUserConversations(companyId);

    return conversations.map((conversation) => {
      const isExporter = conversation.exporterCompanyId === companyId;

      return {
        id: conversation.id,
        listingId: conversation.listingId,
        listing: conversation.listing,
        status: conversation.status,
        myRole: isExporter ? 'EXPORTATEUR' : 'IMPORTATEUR',
        partnerCompany: isExporter
          ? conversation.importerCompany
          : conversation.exporterCompany,
        lastMessage: conversation.messages[0] ?? null,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    });
  }

  async getConversationDetails(conversationId: string, userId: string) {
    return this.getAuthorizedConversationDetails(conversationId, userId);
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    query: GetConversationMessagesQueryDto,
  ) {
    const conversation = await this.getAuthorizedConversationMessages(
      conversationId,
      userId,
      query,
    );
    const hasMore = conversation.messages.length > query.limit;
    const messages = conversation.messages.slice(0, query.limit);
    const nextCursor = hasMore ? (messages.at(-1)?.id ?? null) : null;

    return {
      messages: messages.reverse(),
      nextCursor,
      hasMore,
    };
  }

  async sendMessage(userId: string, dto: CreateMessageDto) {
    await this.getAuthorizedConversation(dto.conversationId, userId);

    return this.messagingRepository.createMessageAndStartContact({
      conversationId: dto.conversationId,
      senderId: userId,
      content: dto.content,
      attachmentUrl: dto.attachmentUrl ?? null,
    });
  }

  async updateConversationStatus(
    conversationId: string,
    userId: string,
    dto: UpdateConversationStatusDto,
  ) {
    await this.getAuthorizedConversation(conversationId, userId);

    return this.messagingRepository.updateConversationStatus(
      conversationId,
      dto.status,
    );
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    await this.getAuthorizedConversation(conversationId, userId);

    const result = await this.messagingRepository.markMessagesAsRead(
      conversationId,
      userId,
    );

    return { updatedCount: result.count };
  }
}
