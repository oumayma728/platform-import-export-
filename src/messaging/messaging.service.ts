import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationAccessSource,
  ListingType,
  SubscriptionStatus,
} from '@prisma/client';

import { ListingsRepository } from '../listings/listings.repository';
import { UsersRepository } from '../users/users.repository';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetConversationMessagesQueryDto } from './dto/get-conversation-messages-query.dto';
import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto';
import { MessagingRepository } from './messaging.repository';
import { StorageService } from '../supabase/storage.service';
import { BillingRepository } from '../billing/billing.repo';
import { BillingService } from '../billing/billing.service';
import { NotificationsService } from '../integrations/notifications/notifications.service';
import type { UploadedFileLike } from '../common/types/uploaded-file.type';

@Injectable()
export class MessagingService {
  constructor(
    private readonly messagingRepository: MessagingRepository,
    private readonly listingsRepository: ListingsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly storageService: StorageService,
    private readonly billingRepository: BillingRepository,
    private readonly billingService: BillingService,
    private readonly notificationsService: NotificationsService,
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
    const context = await this.resolveConversationContext(userId, dto);
    if (context.existingConversation) {
      return context.existingConversation;
    }

    const billingAccount =
      await this.billingRepository.ensureBillingAccount(userId);
    const source = this.hasActiveSubscription(billingAccount)
      ? ConversationAccessSource.ABONNEMENT
      : billingAccount.freeChatsUsed < 50
        ? ConversationAccessSource.GRATUIT
        : null;

    if (!source) {
      throw this.paymentRequiredException(billingAccount.freeChatsUsed);
    }

    const result = await this.messagingRepository.createConversationWithAccess({
      listingId: context.listingId,
      exporterCompanyId: context.exporterCompanyId,
      importerCompanyId: context.importerCompanyId,
      billingAccountId: billingAccount.id,
      source,
    });

    if (result.kind === 'quota_exhausted') {
      // Notify user that free quota is exhausted
      const user = await this.usersRepository.findById(userId);
      if (user) {
        await this.notificationsService
          .sendFreeQuotaExceededNotification({
            id: user.id,
            email: user.email,
            name: user.name,
          })
          .catch(() => {});
      }
      throw this.paymentRequiredException(result.freeChatsUsed);
    }

    // Notify listing owner about matching suggestion
    const listing = await this.listingsRepository.findOne(context.listingId);
    if (listing) {
      const listingOwnerUsers = await this.usersRepository.findByCompanyId(
        listing.companyId,
      );
      for (const owner of listingOwnerUsers) {
        await this.notificationsService
          .sendMatchingSuggestionNotification(
            { id: owner.id, email: owner.email, name: owner.name },
            listing.title,
            result.conversation.id,
          )
          .catch(() => {});
      }
    }

    return result.conversation;
  }

  async startConversationCheckout(userId: string, dto: CreateConversationDto) {
    const context = await this.resolveConversationContext(userId, dto);
    if (context.existingConversation) {
      throw new BadRequestException(
        'Conversation already exists for this listing.',
      );
    }

    const billingAccount =
      await this.billingRepository.ensureBillingAccount(userId);
    if (this.hasActiveSubscription(billingAccount)) {
      throw new BadRequestException(
        'An active subscription already grants access to this conversation.',
      );
    }
    if (billingAccount.freeChatsUsed < 50) {
      throw new BadRequestException(
        'A free conversation is still available for this billing account.',
      );
    }

    return this.billingService.startConversationCheckout({
      userId,
      billingAccountId: billingAccount.id,
      listingId: context.listingId,
      exporterCompanyId: context.exporterCompanyId,
      importerCompanyId: context.importerCompanyId,
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

  async sendMessage(
    userId: string,
    dto: CreateMessageDto,
    file?: UploadedFileLike,
  ) {
    await this.getAuthorizedConversation(dto.conversationId, userId);

    // Upload attachment to Supabase if a file has been uploaded by the user
    let attachmentUrl: string | undefined;
    if (file) {
      const sanitizedFilename = file.originalname.replace(
        /[^a-zA-Z0-9_.-]/g,
        '_',
      );
      const storagePath = `message_${dto.conversationId}/${Date.now()}_${sanitizedFilename}`;
      const bucket_name = 'conversation_attachment';
      attachmentUrl = await this.storageService.uploadFile(
        file,
        storagePath,
        bucket_name,
      );
    }

    // Message creation, conversation status update, and free chats increment are done atomically in one transaction
    const message = await this.messagingRepository.createMessageAndStartContact({
      conversationId: dto.conversationId,
      senderId: userId,
      content: dto.content,
      attachmentUrl: attachmentUrl ?? null,
    });

    // Notify conversation participants about the new message (non-blocking)
    this.notifyNewMessageRecipients(userId, dto.conversationId, dto.content)
      .catch(() => {});

    return message;
  }

  private async notifyNewMessageRecipients(
    senderId: string,
    conversationId: string,
    messageContent: string,
  ) {
    const conversation =
      await this.messagingRepository.findAuthorizedConversationDetails(
        conversationId,
        (await this.getUserCompanyId(senderId)),
      );
    if (!conversation) return;

    const sender = await this.usersRepository.findById(senderId);
    if (!sender) return;

    // Find users in the OTHER company (the one that is not the sender's company)
    const senderCompanyId = await this.usersRepository.getUserCompanyId(senderId);
    const recipientCompanyId =
      conversation.exporterCompanyId === senderCompanyId
        ? conversation.importerCompanyId
        : conversation.exporterCompanyId;

    const recipientUsers =
      await this.usersRepository.findByCompanyId(recipientCompanyId);

    for (const recipient of recipientUsers) {
      await this.notificationsService
        .sendNewMessageNotification(
          {
            id: recipient.id,
            email: recipient.email,
            phone: recipient.phone,
            name: recipient.name,
          },
          sender.name,
          conversationId,
          messageContent,
        )
        .catch(() => {});
    }
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

  private async resolveConversationContext(
    userId: string,
    dto: CreateConversationDto,
  ) {
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

    // Validate that the listing owner is one of the conversation parties
    // This enforces data integrity: a conversation must involve the listing owner
    if (
      listing.companyId !== exporterCompanyId &&
      listing.companyId !== importerCompanyId
    ) {
      throw new BadRequestException(
        'Data integrity error: listing owner must be a participant in the conversation.',
      );
    }

    const existingConversation =
      await this.messagingRepository.findConversationByListing(
        dto.listingId,
        exporterCompanyId,
        importerCompanyId,
      );

    return {
      existingConversation,
      listingId: dto.listingId,
      exporterCompanyId,
      importerCompanyId,
    };
  }

  private hasActiveSubscription(
    billingAccount: Awaited<
      ReturnType<BillingRepository['ensureBillingAccount']>
    >,
  ) {
    const subscription = billingAccount.subscription;
    return !!(
      subscription &&
      subscription.status === SubscriptionStatus.ACTIF &&
      subscription.currentPeriodEnd.getTime() > Date.now()
    );
  }

  private paymentRequiredException(freeChatsUsed: number) {
    return new HttpException(
      {
        code: 'CONVERSATION_PAYMENT_REQUIRED',
        message:
          'Vous avez atteint vos 50 conversations gratuites. Un abonnement actif ou un paiement de 2 USD est requis.',
        freeChatsUsed,
        limit: 50,
        amount: 2,
        currency: 'USD',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
