import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { MessagingRepository } from './messaging.repository';
import { MessagingService } from './messaging.service';

describe('MessagingService', () => {
  let service: MessagingService;
  let repository: {
    getUserCompanyId: jest.Mock;
    findListingById: jest.Mock;
    findConversationByListing: jest.Mock;
    createConversation: jest.Mock;
    createMessage: jest.Mock;
    findUserConversations: jest.Mock;
    findConversationById: jest.Mock;
    updateConversationStatus: jest.Mock;
    markMessagesAsRead: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      getUserCompanyId: jest.fn(),
      findListingById: jest.fn(),
      findConversationByListing: jest.fn(),
      createConversation: jest.fn(),
      createMessage: jest.fn(),
      findUserConversations: jest.fn(),
      findConversationById: jest.fn(),
      updateConversationStatus: jest.fn(),
      markMessagesAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        {
          provide: MessagingRepository,
          useValue: repository,
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('delegates conversation creation to the repository', async () => {
    repository.getUserCompanyId.mockResolvedValue('company-1');
    repository.findListingById.mockResolvedValue({ id: 'listing-1', companyId: 'company-2', type: 'OFFRE' });
    repository.findConversationByListing.mockResolvedValue(null);
    repository.createConversation.mockResolvedValue({ id: 'conversation-1' });
    repository.findConversationById.mockResolvedValue({
      id: 'conversation-1',
      status: 'SUGGEREE',
      exporterCompanyId: 'company-2',
      importerCompanyId: 'company-1',
    });
    repository.createMessage.mockResolvedValue({ id: 'message-1' });
    repository.updateConversationStatus.mockResolvedValue({ id: 'conversation-1' });

    await service.createConversation('user-1', {
      listingId: 'listing-1',
      initialMessage: 'Hello',
    } as any);

    expect(repository.getUserCompanyId).toHaveBeenCalledWith('user-1');
    expect(repository.findListingById).toHaveBeenCalledWith('listing-1');
    expect(repository.createConversation).toHaveBeenCalled();
  });
});
