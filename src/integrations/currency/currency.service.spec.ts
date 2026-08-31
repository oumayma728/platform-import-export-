import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let httpService: { get: jest.Mock };
  let cacheManager: { get: jest.Mock; set: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
    };
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('test-api-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cacheManager,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convert', () => {
    it('should return 1:1 conversion for same currencies without API call', async () => {
      const result = await service.convert(100, 'USD', 'USD');
      expect(result).toEqual({
        amount: 100,
        from: 'USD',
        to: 'USD',
        convertedAmount: 100,
        rate: 1,
        date: expect.any(String),
      });
      expect(cacheManager.get).not.toHaveBeenCalled();
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should return converted amount using fetched rate', async () => {
      cacheManager.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(
        of({
          data: {
            result: 'success',
            base_code: 'EUR',
            time_last_update_utc: 'Fri, 27 Mar 2020 00:00:00 +0000',
            conversion_rates: {
              USD: 1.08,
            },
          },
        }),
      );

      const result = await service.convert(100, 'EUR', 'USD');
      expect(result.amount).toBe(100);
      expect(result.from).toBe('EUR');
      expect(result.to).toBe('USD');
      expect(result.rate).toBe(1.08);
      expect(result.convertedAmount).toBe(108);
      expect(result.date).toBe('2020-03-27');
      expect(cacheManager.set).toHaveBeenCalledWith(
        'rate:EUR:USD',
        { rate: 1.08, date: '2020-03-27' },
        3600000,
      );
    });
  });

  describe('getRate', () => {
    it('should return cached rate when present', async () => {
      cacheManager.get.mockResolvedValue({
        rate: 1.15,
        date: '2026-08-31',
      });

      const result = await service.getRate('EUR', 'USD');
      expect(result).toEqual({ rate: 1.15, date: '2026-08-31' });
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when API returns error result', async () => {
      cacheManager.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(
        of({
          data: {
            result: 'error',
            'error-type': 'unsupported-code',
          },
        }),
      );

      await expect(service.getRate('XYZ', 'USD')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when target currency is not in rates', async () => {
      cacheManager.get.mockResolvedValue(null);
      httpService.get.mockReturnValue(
        of({
          data: {
            result: 'success',
            base_code: 'EUR',
            conversion_rates: {
              USD: 1.08,
            },
          },
        }),
      );

      await expect(service.getRate('EUR', 'UNKNOWN')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when API key is missing', async () => {
      configService.get.mockReturnValue(undefined);
      const originalEnv = process.env.CURRENCY_CONVERTER_API_KEY;
      delete process.env.CURRENCY_CONVERTER_API_KEY;

      try {
        cacheManager.get.mockResolvedValue(null);
        await expect(service.getRate('EUR', 'USD')).rejects.toThrow(
          BadRequestException,
        );
      } finally {
        process.env.CURRENCY_CONVERTER_API_KEY = originalEnv;
      }
    });
  });
});
