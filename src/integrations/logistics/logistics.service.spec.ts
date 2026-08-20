import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';

import { LogisticsService } from './logistics.service';

describe('LogisticsService', () => {
  let service: LogisticsService;
  let httpService: { get: jest.Mock; post: jest.Mock };
  let cacheManager: { get: jest.Mock; set: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    configService = {
      get: jest.fn().mockReturnValue('mock-api-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticsService,
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

    service = module.get<LogisticsService>(LogisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws BadRequestException if origin or destination is empty', async () => {
    await expect(service.calculate_route('', 'France')).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.calculate_route('Tunisia', '  ')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('returns 0 km and 1 day for the same country', async () => {
    const result = await service.calculate_route('Tunisia', 'Tunisia');

    expect(result).toEqual({
      origin_country: 'Tunisia',
      destination_country: 'Tunisia',
      distance_km: 0,
      estimated_cost_usd: 0,
      estimated_days: 1,
    });
    expect(cacheManager.get).not.toHaveBeenCalled();
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('returns cached result on cache hit', async () => {
    const cachedResult = {
      origin_country: 'Tunisia',
      destination_country: 'France',
      distance_km: 1780,
      estimated_cost_usd: 851,
      estimated_days: 4,
    };

    cacheManager.get.mockResolvedValueOnce(cachedResult);

    const result = await service.calculate_route('Tunisia', 'France');

    expect(result).toEqual(cachedResult);
    expect(cacheManager.get).toHaveBeenCalledWith('logistics:tunisia:france');
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('computes route via OpenRouteService Directions API on cache miss', async () => {
    // Cache miss for logistics route
    cacheManager.get.mockResolvedValueOnce(null);
    // Cache miss for origin geocode
    cacheManager.get.mockResolvedValueOnce(null);
    // Geocode origin (Tunisia)
    httpService.get.mockReturnValueOnce(
      of({
        data: {
          features: [
            {
              geometry: {
                coordinates: [9.007775, 33.687264],
              },
            },
          ],
        },
      }),
    );

    // Cache miss for dest geocode
    cacheManager.get.mockResolvedValueOnce(null);
    // Geocode dest (France)
    httpService.get.mockReturnValueOnce(
      of({
        data: {
          features: [
            {
              geometry: {
                coordinates: [2.213749, 46.227638],
              },
            },
          ],
        },
      }),
    );

    // Directions API response
    httpService.post.mockReturnValueOnce(
      of({
        data: {
          routes: [
            {
              summary: {
                distance: 1800000, // 1800 km
                duration: 86400, // 1 day
              },
            },
          ],
        },
      }),
    );

    const result = await service.calculate_route('Tunisia', 'France');

    expect(result.origin_country).toBe('Tunisia');
    expect(result.destination_country).toBe('France');
    expect(result.distance_km).toBe(1800);
    expect(result.estimated_cost_usd).toBe(860); // 50 + 1800 * 0.45 = 860
    expect(result.estimated_days).toBe(3); // 1 + 2 = 3
    expect(cacheManager.set).toHaveBeenCalled();
  });

  it('falls back to Haversine calculation when Directions API fails (e.g. across ocean)', async () => {
    // Cache miss for route
    cacheManager.get.mockResolvedValueOnce(null);
    // Geocodes cached
    cacheManager.get.mockResolvedValueOnce([9.007775, 33.687264]); // Tunisia
    cacheManager.get.mockResolvedValueOnce([-51.92528, -14.235004]); // Brazil

    // Directions API fails
    httpService.post.mockReturnValueOnce(
      throwError(() => new Error('No road route available')),
    );

    const result = await service.calculate_route('Tunisia', 'Brazil');

    expect(result.origin_country).toBe('Tunisia');
    expect(result.destination_country).toBe('Brazil');
    expect(result.distance_km).toBeGreaterThan(5000);
    expect(result.estimated_cost_usd).toBeGreaterThan(2000);
    expect(result.estimated_days).toBeGreaterThan(5);
    expect(cacheManager.set).toHaveBeenCalled();
  });

  it('throws BadRequestException if country geocoding yields no results', async () => {
    cacheManager.get.mockResolvedValue(null);
    httpService.get.mockReturnValueOnce(
      of({
        data: {
          features: [],
        },
      }),
    );

    await expect(
      service.getCountryCoordinates('UnknownCountryNameXYZ'),
    ).rejects.toThrow(BadRequestException);
  });
});
