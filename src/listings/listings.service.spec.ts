import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CompaniesRepository } from '../companies/companies.repository';
import { StorageService } from '../supabase/storage.service';
import { ListingsRepository } from './listings.repository';
import { ListingsService } from './listings.service';

describe('ListingsService', () => {
  let service: ListingsService;
  let listingsRepository: { createDocument: jest.Mock; findOne: jest.Mock };
  let storageService: { uploadFile: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        {
          provide: ListingsRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            search: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            remove: jest.fn(),
            createDocument: jest.fn(),
          },
        },
        {
          provide: CompaniesRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    listingsRepository = module.get(ListingsRepository);
    storageService = module.get(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws when the listing does not exist', async () => {
    listingsRepository.findOne.mockResolvedValue(null);

    const file = {
      originalname: 'doc.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('test'),
    } as any;

    await expect(service.addDocument('missing-id', file)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates a listing document when the listing exists', async () => {
    const file = {
      originalname: 'doc.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('test'),
    } as any;

    const document = {
      id: 'doc-1',
      listingId: 'listing-1',
      fileUrl: 'https://example.com/doc.pdf',
      fileType: 'application/pdf',
      uploadedAt: new Date(),
    };

    listingsRepository.findOne.mockResolvedValue({ id: 'listing-1' });
    storageService.uploadFile.mockResolvedValue(document.fileUrl);
    listingsRepository.createDocument.mockResolvedValue(document);

    await expect(service.addDocument('listing-1', file)).resolves.toEqual(
      document,
    );
  });
});
