import { Test, TestingModule } from '@nestjs/testing';

import { ListingsRepository } from '../listings/listings.repository';
import { UsersRepository } from '../users/users.repository';
import { MessagingRepository } from './messaging.repository';
import { MessagingService } from './messaging.service';

describe('MessagingService', () => {
  let service: MessagingService;
  let messagingRepository: {
    findConversationByListing: jest.Mock;
    createSuggestedConversation: jest.Mock;
  };
  let listingsRepository: { findOne: jest.Mock };
  let usersRepository: { getUserCompanyId: jest.Mock };

  beforeEach(async () => {
    messagingRepository = {
      findConversationByListing: jest.fn(),
      createSuggestedConversation: jest.fn(),
    };
    listingsRepository = { findOne: jest.fn() };
    usersRepository = { getUserCompanyId: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: MessagingRepository, useValue: messagingRepository },
        { provide: ListingsRepository, useValue: listingsRepository },
        { provide: UsersRepository, useValue: usersRepository },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
  });

  it('creates an empty suggested conversation for a new match', async () => {
    usersRepository.getUserCompanyId.mockResolvedValue('importer-company');
    listingsRepository.findOne.mockResolvedValue({
      id: 'listing-1',
      companyId: 'exporter-company',
      type: 'OFFRE',
    });
    messagingRepository.findConversationByListing.mockResolvedValue(null);
    messagingRepository.createSuggestedConversation.mockResolvedValue({
      id: 'conversation-1',
      status: 'SUGGEREE',
    });

    await service.createConversation('user-1', { listingId: 'listing-1' });

    expect(
      messagingRepository.createSuggestedConversation,
    ).toHaveBeenCalledWith({
      listingId: 'listing-1',
      exporterCompanyId: 'exporter-company',
      importerCompanyId: 'importer-company',
    });
  });
});
