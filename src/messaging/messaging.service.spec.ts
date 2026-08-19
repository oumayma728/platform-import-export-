import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingStatus,
  ConversationAccessSource,
  ListingType,
  SubscriptionStatus,
} from '@prisma/client';

import { MessagingService } from './messaging.service';
import { MessagingRepository } from './messaging.repository';
import { ListingsRepository } from '../listings/listings.repository';
import { UsersRepository } from '../users/users.repository';
import { StorageService } from '../supabase/storage.service';
import { BillingRepository } from '../billing/billing.repo';
import { BillingService } from '../billing/billing.service';

describe('MessagingService', () => {
  let service: MessagingService;
  let messagingRepository: jest.Mocked<MessagingRepository>;
  let listingsRepository: jest.Mocked<ListingsRepository>;
  let usersRepository: jest.Mocked<UsersRepository>;
  let storageService: jest.Mocked<StorageService>;
  let billingRepository: jest.Mocked<BillingRepository>;
  let billingService: jest.Mocked<BillingService>;

  const mockUserId = 'user-123';
  const mockCompanyId = 'company-123';
  const mockPartnerCompanyId = 'company-456';
  const mockListingId = 'listing-789';
  const mockConversationId = 'conv-101';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: MessagingRepository,
          useValue: {
            findAuthorizedConversation: jest.fn(),
            findAuthorizedConversationDetails: jest.fn(),
            findAuthorizedConversationMessages: jest.fn(),
            findConversationByListing: jest.fn(),
            createConversationWithAccess: jest.fn(),
            findUserConversations: jest.fn(),
            createMessageAndStartContact: jest.fn(),
            updateConversationStatus: jest.fn(),
            markMessagesAsRead: jest.fn(),
          },
        },
        {
          provide: ListingsRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            getUserCompanyId: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
        {
          provide: BillingRepository,
          useValue: {
            findBillingAccount: jest.fn(),
            ensureBillingAccount: jest.fn(),
          },
        },
        {
          provide: BillingService,
          useValue: {
            startConversationCheckout: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
    messagingRepository = module.get(MessagingRepository);
    listingsRepository = module.get(ListingsRepository);
    usersRepository = module.get(UsersRepository);
    storageService = module.get(StorageService);
    billingRepository = module.get(BillingRepository);
    billingService = module.get(BillingService);

    billingRepository.ensureBillingAccount.mockResolvedValue({
      id: 'ba-123',
      userId: mockUserId,
      freeChatsUsed: 0,
      billingStatus: BillingStatus.GRATUIT,
      subscription: null,
    } as any);
    messagingRepository.createConversationWithAccess.mockResolvedValue({
      kind: 'created',
      conversation: { id: mockConversationId },
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserCompanyId validation', () => {
    it('should throw BadRequestException if user is not associated with a company', async () => {
      usersRepository.getUserCompanyId.mockResolvedValue(null);

      await expect(
        service.createConversation(mockUserId, { listingId: mockListingId }),
      ).rejects.toThrow(
        new BadRequestException(
          'User must be associated with a registered company to access conversations.',
        ),
      );
    });
  });

  describe('createConversation', () => {
    beforeEach(() => {
      usersRepository.getUserCompanyId.mockResolvedValue(mockCompanyId);
    });

    it('should throw NotFoundException if the target listing does not exist', async () => {
      listingsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createConversation(mockUserId, { listingId: mockListingId }),
      ).rejects.toThrow(new NotFoundException('Target listing not found.'));
    });

    it('should throw BadRequestException if user initiates a conversation on their own listing', async () => {
      listingsRepository.findOne.mockResolvedValue({
        id: mockListingId,
        companyId: mockCompanyId,
      } as any);

      await expect(
        service.createConversation(mockUserId, { listingId: mockListingId }),
      ).rejects.toThrow(
        new BadRequestException(
          'You cannot initiate a conversation on your own listing.',
        ),
      );
    });

    it('should assign roles correctly when listing type is OFFRE', async () => {
      listingsRepository.findOne.mockResolvedValue({
        id: mockListingId,
        companyId: mockPartnerCompanyId,
        type: ListingType.OFFRE,
      } as any);
      messagingRepository.findConversationByListing.mockResolvedValue(null);
      const result = await service.createConversation(mockUserId, {
        listingId: mockListingId,
      });

      expect(
        messagingRepository.findConversationByListing,
      ).toHaveBeenCalledWith(
        mockListingId,
        mockPartnerCompanyId, // Exporter
        mockCompanyId, // Importer
      );
      expect(
        messagingRepository.createConversationWithAccess,
      ).toHaveBeenCalledWith({
        listingId: mockListingId,
        exporterCompanyId: mockPartnerCompanyId,
        importerCompanyId: mockCompanyId,
        billingAccountId: 'ba-123',
        source: ConversationAccessSource.GRATUIT,
      });
      expect(result).toEqual({ id: mockConversationId });
    });

    it('should assign roles correctly when listing type is DEMANDE', async () => {
      listingsRepository.findOne.mockResolvedValue({
        id: mockListingId,
        companyId: mockPartnerCompanyId,
        type: ListingType.DEMANDE,
      } as any);
      messagingRepository.findConversationByListing.mockResolvedValue(null);
      await service.createConversation(mockUserId, {
        listingId: mockListingId,
      });

      expect(
        messagingRepository.findConversationByListing,
      ).toHaveBeenCalledWith(
        mockListingId,
        mockCompanyId, // Exporter
        mockPartnerCompanyId, // Importer
      );
      expect(
        messagingRepository.createConversationWithAccess,
      ).toHaveBeenCalledWith({
        listingId: mockListingId,
        exporterCompanyId: mockCompanyId,
        importerCompanyId: mockPartnerCompanyId,
        billingAccountId: 'ba-123',
        source: ConversationAccessSource.GRATUIT,
      });
    });

    it('should return existing conversation without creating a new one if found', async () => {
      const mockExisting = { id: mockConversationId, status: 'OPEN' };
      listingsRepository.findOne.mockResolvedValue({
        id: mockListingId,
        companyId: mockPartnerCompanyId,
        type: ListingType.OFFRE,
      } as any);
      messagingRepository.findConversationByListing.mockResolvedValue(
        mockExisting as any,
      );

      const result = await service.createConversation(mockUserId, {
        listingId: mockListingId,
      });

      expect(result).toBe(mockExisting);
      expect(
        messagingRepository.createConversationWithAccess,
      ).not.toHaveBeenCalled();
    });

    it('should use subscription access without consuming a free conversation', async () => {
      listingsRepository.findOne.mockResolvedValue({
        id: mockListingId,
        companyId: mockPartnerCompanyId,
        type: ListingType.OFFRE,
      } as any);
      messagingRepository.findConversationByListing.mockResolvedValue(null);
      billingRepository.ensureBillingAccount.mockResolvedValue({
        id: 'ba-123',
        freeChatsUsed: 50,
        billingStatus: BillingStatus.ABONNE,
        subscription: {
          status: SubscriptionStatus.ACTIF,
          currentPeriodEnd: new Date(Date.now() + 60_000),
        },
      } as any);

      await service.createConversation(mockUserId, {
        listingId: mockListingId,
      });

      expect(
        messagingRepository.createConversationWithAccess,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          source: ConversationAccessSource.ABONNEMENT,
        }),
      );
    });

    it('should require checkout after 50 free conversations', async () => {
      listingsRepository.findOne.mockResolvedValue({
        id: mockListingId,
        companyId: mockPartnerCompanyId,
        type: ListingType.OFFRE,
      } as any);
      messagingRepository.findConversationByListing.mockResolvedValue(null);
      billingRepository.ensureBillingAccount.mockResolvedValue({
        id: 'ba-123',
        freeChatsUsed: 50,
        billingStatus: BillingStatus.LIMITE_ATTEINTE,
        subscription: null,
      } as any);

      await expect(
        service.createConversation(mockUserId, { listingId: mockListingId }),
      ).rejects.toMatchObject({ status: 402 });
      expect(
        messagingRepository.createConversationWithAccess,
      ).not.toHaveBeenCalled();
    });

    it('should require checkout if the atomic quota update is exhausted', async () => {
      listingsRepository.findOne.mockResolvedValue({
        id: mockListingId,
        companyId: mockPartnerCompanyId,
        type: ListingType.OFFRE,
      } as any);
      messagingRepository.findConversationByListing.mockResolvedValue(null);
      messagingRepository.createConversationWithAccess.mockResolvedValue({
        kind: 'quota_exhausted',
        freeChatsUsed: 50,
      } as any);

      await expect(
        service.createConversation(mockUserId, { listingId: mockListingId }),
      ).rejects.toBeInstanceOf(HttpException);
    });
  });

  describe('startConversationCheckout', () => {
    it('should start the $2 checkout only after the free quota is exhausted', async () => {
      usersRepository.getUserCompanyId.mockResolvedValue(mockCompanyId);
      listingsRepository.findOne.mockResolvedValue({
        id: mockListingId,
        companyId: mockPartnerCompanyId,
        type: ListingType.OFFRE,
      } as any);
      messagingRepository.findConversationByListing.mockResolvedValue(null);
      billingRepository.ensureBillingAccount.mockResolvedValue({
        id: 'ba-123',
        freeChatsUsed: 50,
        billingStatus: BillingStatus.LIMITE_ATTEINTE,
        subscription: null,
      } as any);
      billingService.startConversationCheckout.mockResolvedValue({
        sessionId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
      });

      await expect(
        service.startConversationCheckout(mockUserId, {
          listingId: mockListingId,
        }),
      ).resolves.toEqual({
        sessionId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
      });

      expect(billingService.startConversationCheckout).toHaveBeenCalledWith({
        userId: mockUserId,
        billingAccountId: 'ba-123',
        listingId: mockListingId,
        exporterCompanyId: mockPartnerCompanyId,
        importerCompanyId: mockCompanyId,
      });
    });
  });

  describe('getUserConversations', () => {
    it('should map user conversations correctly when user is EXPORTATEUR', async () => {
      usersRepository.getUserCompanyId.mockResolvedValue(mockCompanyId);
      const mockConversations = [
        {
          id: mockConversationId,
          listingId: mockListingId,
          listing: { title: 'Test Listing' },
          status: 'ACTIVE',
          exporterCompanyId: mockCompanyId,
          importerCompanyId: mockPartnerCompanyId,
          exporterCompany: { name: 'My Company' },
          importerCompany: { name: 'Partner Company' },
          messages: [{ id: 'msg-1', content: 'Hello' }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      messagingRepository.findUserConversations.mockResolvedValue(
        mockConversations as any,
      );

      const result = await service.getUserConversations(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockConversationId,
        listingId: mockListingId,
        listing: { title: 'Test Listing' },
        status: 'ACTIVE',
        myRole: 'EXPORTATEUR',
        partnerCompany: { name: 'Partner Company' },
        lastMessage: { id: 'msg-1', content: 'Hello' },
        createdAt: mockConversations[0].createdAt,
        updatedAt: mockConversations[0].updatedAt,
      });
    });

    it('should map user conversations correctly when user is IMPORTATEUR and has no messages', async () => {
      usersRepository.getUserCompanyId.mockResolvedValue(mockCompanyId);
      const mockConversations = [
        {
          id: mockConversationId,
          listingId: mockListingId,
          listing: { title: 'Test Listing' },
          status: 'ACTIVE',
          exporterCompanyId: mockPartnerCompanyId,
          importerCompanyId: mockCompanyId,
          exporterCompany: { name: 'Exporter Corp' },
          importerCompany: { name: 'My Company' },
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      messagingRepository.findUserConversations.mockResolvedValue(
        mockConversations as any,
      );

      const result = await service.getUserConversations(mockUserId);

      expect(result[0].myRole).toBe('IMPORTATEUR');
      expect(result[0].partnerCompany).toEqual({ name: 'Exporter Corp' });
      expect(result[0].lastMessage).toBeNull();
    });
  });

  describe('getConversationDetails', () => {
    it('should return conversation details when authorized', async () => {
      usersRepository.getUserCompanyId.mockResolvedValue(mockCompanyId);
      const mockDetails = { id: mockConversationId, title: 'Details' };
      messagingRepository.findAuthorizedConversationDetails.mockResolvedValue(
        mockDetails as any,
      );

      const result = await service.getConversationDetails(
        mockConversationId,
        mockUserId,
      );

      expect(
        messagingRepository.findAuthorizedConversationDetails,
      ).toHaveBeenCalledWith(mockConversationId, mockCompanyId);
      expect(result).toBe(mockDetails);
    });

    it('should throw ForbiddenException when user is not authorized', async () => {
      usersRepository.getUserCompanyId.mockResolvedValue(mockCompanyId);
      messagingRepository.findAuthorizedConversationDetails.mockResolvedValue(
        null,
      );

      await expect(
        service.getConversationDetails(mockConversationId, mockUserId),
      ).rejects.toThrow(
        new ForbiddenException(
          'You are not authorized to access this conversation.',
        ),
      );
    });
  });

  describe('getConversationMessages', () => {
    const query = { limit: 2, cursor: 'msg-0' };

    beforeEach(() => {
      usersRepository.getUserCompanyId.mockResolvedValue(mockCompanyId);
    });

    it('should paginate, reverse messages, and compute nextCursor when hasMore is true', async () => {
      const mockConversation = {
        id: mockConversationId,
        messages: [
          { id: 'msg-3', text: 'Three' },
          { id: 'msg-2', text: 'Two' },
          { id: 'msg-1', text: 'One' }, // Extra item fetched (limit + 1)
        ],
      };
      messagingRepository.findAuthorizedConversationMessages.mockResolvedValue(
        mockConversation as any,
      );

      const result = await service.getConversationMessages(
        mockConversationId,
        mockUserId,
        query as any,
      );

      expect(
        messagingRepository.findAuthorizedConversationMessages,
      ).toHaveBeenCalledWith(mockConversationId, mockCompanyId, 3, 'msg-0');
      expect(result).toEqual({
        messages: [
          { id: 'msg-2', text: 'Two' },
          { id: 'msg-3', text: 'Three' },
        ],
        nextCursor: 'msg-2',
        hasMore: true,
      });
    });

    it('should handle pagination correctly when hasMore is false', async () => {
      const mockConversation = {
        id: mockConversationId,
        messages: [{ id: 'msg-1', text: 'One' }],
      };
      messagingRepository.findAuthorizedConversationMessages.mockResolvedValue(
        mockConversation as any,
      );

      const result = await service.getConversationMessages(
        mockConversationId,
        mockUserId,
        query as any,
      );

      expect(result).toEqual({
        messages: [{ id: 'msg-1', text: 'One' }],
        nextCursor: null,
        hasMore: false,
      });
    });
  });

  describe('sendMessage', () => {
    const dto = {
      conversationId: mockConversationId,
      content: 'Hello World',
    };

    beforeEach(() => {
      usersRepository.getUserCompanyId.mockResolvedValue(mockCompanyId);
    });

    it('should create a message and pass null when no file is uploaded', async () => {
      messagingRepository.findAuthorizedConversation.mockResolvedValue({
        id: mockConversationId,
      } as any);
      messagingRepository.createMessageAndStartContact.mockResolvedValue({
        id: 'msg-1',
      } as any);

      const result = await service.sendMessage(mockUserId, dto);

      expect(
        messagingRepository.createMessageAndStartContact,
      ).toHaveBeenCalledWith({
        conversationId: mockConversationId,
        senderId: mockUserId,
        content: 'Hello World',
        attachmentUrl: null,
      });
      expect(result).toEqual({ id: 'msg-1' });
      expect(billingRepository.findBillingAccount).not.toHaveBeenCalled();
    });

    it('should upload file and send message with attachmentUrl when file is provided', async () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test file.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
      };

      messagingRepository.findAuthorizedConversation.mockResolvedValue({
        id: mockConversationId,
      } as any);
      storageService.uploadFile.mockResolvedValue(
        'https://example.com/uploaded.pdf',
      );
      messagingRepository.createMessageAndStartContact.mockResolvedValue({
        id: 'msg-1',
        ...dto,
        attachmentUrl: 'https://example.com/uploaded.pdf',
      } as any);

      const result = await service.sendMessage(mockUserId, dto, mockFile);

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        expect.stringMatching(/^message_conv-101\/\d+_test_file\.pdf$/),
        'conversation_attachment',
      );
      expect(
        messagingRepository.createMessageAndStartContact,
      ).toHaveBeenCalledWith({
        conversationId: mockConversationId,
        senderId: mockUserId,
        content: dto.content,
        attachmentUrl: 'https://example.com/uploaded.pdf',
      });
      expect(result).toEqual({
        id: 'msg-1',
        ...dto,
        attachmentUrl: 'https://example.com/uploaded.pdf',
      });
    });

    it('should throw ForbiddenException if user is not authorized to send message in conversation', async () => {
      messagingRepository.findAuthorizedConversation.mockResolvedValue(null);

      await expect(service.sendMessage(mockUserId, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(
        messagingRepository.createMessageAndStartContact,
      ).not.toHaveBeenCalled();
    });
  });

  describe('updateConversationStatus', () => {
    const dto = { status: 'CLOSED' as any };

    beforeEach(() => {
      usersRepository.getUserCompanyId.mockResolvedValue(mockCompanyId);
    });

    it('should update conversation status when authorized', async () => {
      messagingRepository.findAuthorizedConversation.mockResolvedValue({
        id: mockConversationId,
      } as any);
      messagingRepository.updateConversationStatus.mockResolvedValue({
        id: mockConversationId,
        status: 'CLOSED',
      } as any);

      const result = await service.updateConversationStatus(
        mockConversationId,
        mockUserId,
        dto,
      );

      expect(
        messagingRepository.findAuthorizedConversation,
      ).toHaveBeenCalledWith(mockConversationId, mockCompanyId);
      expect(messagingRepository.updateConversationStatus).toHaveBeenCalledWith(
        mockConversationId,
        'CLOSED',
      );
      expect(result).toEqual({ id: mockConversationId, status: 'CLOSED' });
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      messagingRepository.findAuthorizedConversation.mockResolvedValue(null);

      await expect(
        service.updateConversationStatus(mockConversationId, mockUserId, dto),
      ).rejects.toThrow(ForbiddenException);
      expect(
        messagingRepository.updateConversationStatus,
      ).not.toHaveBeenCalled();
    });
  });

  describe('markMessagesAsRead', () => {
    beforeEach(() => {
      usersRepository.getUserCompanyId.mockResolvedValue(mockCompanyId);
    });

    it('should mark messages as read and return updated count when authorized', async () => {
      messagingRepository.findAuthorizedConversation.mockResolvedValue({
        id: mockConversationId,
      } as any);
      messagingRepository.markMessagesAsRead.mockResolvedValue({ count: 5 });

      const result = await service.markMessagesAsRead(
        mockConversationId,
        mockUserId,
      );

      expect(
        messagingRepository.findAuthorizedConversation,
      ).toHaveBeenCalledWith(mockConversationId, mockCompanyId);
      expect(messagingRepository.markMessagesAsRead).toHaveBeenCalledWith(
        mockConversationId,
        mockUserId,
      );
      expect(result).toEqual({ updatedCount: 5 });
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      messagingRepository.findAuthorizedConversation.mockResolvedValue(null);

      await expect(
        service.markMessagesAsRead(mockConversationId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
      expect(messagingRepository.markMessagesAsRead).not.toHaveBeenCalled();
    });
  });
});
