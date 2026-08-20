import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CompaniesRepository } from '../companies/companies.repository';
import { CurrencyService } from '../integrations/currency/currency.service';
import { LogisticsService } from '../integrations/logistics/logistics.service';
import { StorageService } from '../supabase/storage.service';
import { ListingsRepository } from './listings.repository';
import { ListingsService } from './listings.service';

describe('ListingsService', () => {
  let service: ListingsService;
  let listingsRepository: {
    create: jest.Mock;
    createDocument: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let storageService: { uploadFile: jest.Mock };
  let companiesRepository: { findOne: jest.Mock };
  let currencyService: { convert: jest.Mock };
  let logisticsService: { calculate_route: jest.Mock };

  beforeEach(async () => {
    listingsRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      remove: jest.fn(),
      createDocument: jest.fn(),
    } as any;

    companiesRepository = {
      findOne: jest.fn(),
    };

    storageService = {
      uploadFile: jest.fn(),
    };

    currencyService = {
      convert: jest.fn(),
    };

    logisticsService = {
      calculate_route: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        {
          provide: ListingsRepository,
          useValue: listingsRepository,
        },
        {
          provide: CompaniesRepository,
          useValue: companiesRepository,
        },
        {
          provide: StorageService,
          useValue: storageService,
        },
        {
          provide: CurrencyService,
          useValue: currencyService,
        },
        {
          provide: LogisticsService,
          useValue: logisticsService,
        },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates listing and enriches with logistics estimate when available', async () => {
    const company = { id: 'comp-1', country: 'Tunisia' };
    const createDto = {
      companyId: 'comp-1',
      type: 'OFFRE' as any,
      title: 'Olive Oil',
      category: 'Food',
      price: 100,
      currency: 'USD',
      quantity: 50,
      unit: 'L',
      country: 'France',
      incoterm: 'FOB',
    };

    companiesRepository.findOne.mockResolvedValue(company);
    listingsRepository.create.mockResolvedValue({ id: 'list-1', ...createDto });
    logisticsService.calculate_route.mockResolvedValue({
      origin_country: 'Tunisia',
      destination_country: 'France',
      distance_km: 1780,
      estimated_cost_usd: 851,
      estimated_days: 4,
    });

    const result = await service.create(createDto);

    expect(result).toHaveProperty('logisticsEstimate');
    expect(logisticsService.calculate_route).toHaveBeenCalledWith(
      'Tunisia',
      'France',
    );
  });

  it('throws when the listing does not exist on addDocument', async () => {
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
