import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';

import {
  OPEN_ROUTE_SERVICE_API,
  LOGISTICS_BASE_COST_USD,
  LOGISTICS_COST_PER_KM_USD,
  LOGISTICS_KM_PER_DAY,
  LOGISTICS_BASE_DAYS,
} from '../../common/constants/variables';

/** TTL for cached logistics route calculations (24 hours in milliseconds) */
const LOGISTICS_CACHE_TTL = 24 * 60 * 60 * 1000;

/** TTL for cached country geocoding coordinates (7 days in milliseconds) */
const GEO_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

export interface LogisticsEstimateResult {
  origin_country: string;
  destination_country: string;
  distance_km: number;
  estimated_cost_usd: number;
  estimated_days: number;
}

interface GeoJsonResponse {
  features?: Array<{
    geometry: {
      coordinates: [number, number]; // [longitude, latitude]
    };
    properties?: {
      name?: string;
      country?: string;
    };
  }>;
}

interface DirectionsResponse {
  routes?: Array<{
    summary: {
      distance: number; // in meters
      duration: number; // in seconds
    };
  }>;
}

@Injectable()
export class LogisticsService {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Calculates the estimated distance, cost, and transit days between two countries.
   * Checks Redis cache first; on miss, uses OpenRouteService with fallback to Geodesic distance.
   */
  async calculate_route(
    origin_country: string,
    destination_country: string,
  ): Promise<LogisticsEstimateResult> {
    const origin = origin_country.trim();
    const destination = destination_country.trim();

    if (!origin || !destination) {
      throw new BadRequestException(
        'Origin country and destination country must not be empty.',
      );
    }

    const originKey = origin.toLowerCase();
    const destinationKey = destination.toLowerCase();

    // Same country — minimal local transit
    if (originKey === destinationKey) {
      return {
        origin_country: origin,
        destination_country: destination,
        distance_km: 0,
        estimated_cost_usd: 0,
        estimated_days: 1,
      };
    }

    const cacheKey = `logistics:${originKey}:${destinationKey}`;

    // Check Redis cache
    const cached = await this.cacheManager.get<LogisticsEstimateResult>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    this.logger.log(
      `Cache miss for ${cacheKey} — estimating logistics via OpenRouteService`,
    );

    // Geocode both countries to obtain [longitude, latitude]
    const [originCoords, destCoords] = await Promise.all([
      this.getCountryCoordinates(origin),
      this.getCountryCoordinates(destination),
    ]);

    let distanceKm: number;
    let estimatedDays: number;

    try {
      // Attempt driving route via OpenRouteService Directions API
      const routeData = await this.fetchDirectionsRoute(
        originCoords,
        destCoords,
      );

      distanceKm = Math.round((routeData.distance / 1000) * 100) / 100;
      // Duration from seconds to days + base handling/customs days
      estimatedDays = Math.max(
        1,
        Math.ceil(routeData.duration / (24 * 3600)) + LOGISTICS_BASE_DAYS,
      );
    } catch (routeError: any) {
      this.logger.warn(
        `OpenRouteService road directions not available for ${origin} -> ${destination} (${routeError.message}). Using Geodesic calculation fallback.`,
      );

      // Fallback: Haversine distance with 1.25x shipping circuity factor for air/sea transit
      const straightDistance = this.calculateHaversineDistance(
        originCoords[1],
        originCoords[0],
        destCoords[1],
        destCoords[0],
      );

      distanceKm = Math.round(straightDistance * 1.25 * 100) / 100;
      estimatedDays = Math.max(
        2,
        Math.ceil(distanceKm / LOGISTICS_KM_PER_DAY) + LOGISTICS_BASE_DAYS,
      );
    }

    // Cost formula: Fixed baseline handling fee + rate per km
    const estimatedCostUsd =
      Math.round(
        (LOGISTICS_BASE_COST_USD + distanceKm * LOGISTICS_COST_PER_KM_USD) * 100,
      ) / 100;

    const result: LogisticsEstimateResult = {
      origin_country: origin,
      destination_country: destination,
      distance_km: distanceKm,
      estimated_cost_usd: estimatedCostUsd,
      estimated_days: estimatedDays,
    };

    // Store in Redis cache
    await this.cacheManager.set(cacheKey, result, LOGISTICS_CACHE_TTL);
    this.logger.log(
      `Cached logistics route ${origin} -> ${destination}: ${distanceKm}km, $${estimatedCostUsd}, ${estimatedDays} days`,
    );

    return result;
  }

  /**
   * CamelCase alias for calculate_route
   */
  async calculateRoute(
    originCountry: string,
    destinationCountry: string,
  ): Promise<LogisticsEstimateResult> {
    return this.calculate_route(originCountry, destinationCountry);
  }

  /**
   * Geocodes a country name into [longitude, latitude] coordinates using OpenRouteService.
   * Coordinates are cached in Redis.
   */
  async getCountryCoordinates(country: string): Promise<[number, number]> {
    const countryKey = country.trim().toLowerCase();
    const cacheKey = `geo:${countryKey}`;

    const cached = await this.cacheManager.get<[number, number]>(cacheKey);
    if (cached) {
      return cached;
    }

    const apiKey = this.getApiKey();
    const url = `${OPEN_ROUTE_SERVICE_API}/geocode/search?text=${encodeURIComponent(country)}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<GeoJsonResponse>(url, {
          headers: {
            Authorization: apiKey,
          },
        }),
      );

      const coordinates = response.data?.features?.[0]?.geometry?.coordinates;
      if (!coordinates || coordinates.length < 2) {
        throw new BadRequestException(
          `Unable to resolve geocoding coordinates for country "${country}".`,
        );
      }

      await this.cacheManager.set(cacheKey, coordinates, GEO_CACHE_TTL);
      return coordinates;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Geocoding failed for "${country}": ${error.response?.data?.error?.message ?? error.message}`,
      );
      throw new BadRequestException(
        `Failed to locate country "${country}" with OpenRouteService.`,
      );
    }
  }

  /**
   * Calls OpenRouteService Directions API for heavy goods vehicle route.
   */
  private async fetchDirectionsRoute(
    originCoords: [number, number],
    destCoords: [number, number],
  ): Promise<{ distance: number; duration: number }> {
    const apiKey = this.getApiKey();
    const url = `${OPEN_ROUTE_SERVICE_API}/v2/directions/driving-hgv`;

    const response = await firstValueFrom(
      this.httpService.post<DirectionsResponse>(
        url,
        {
          coordinates: [originCoords, destCoords],
          radiuses: [-1, -1],
        },
        {
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      ),
    );

    const summary = response.data?.routes?.[0]?.summary;
    if (!summary || typeof summary.distance !== 'number') {
      throw new Error('No valid route summary returned by OpenRouteService.');
    }

    return {
      distance: summary.distance,
      duration: summary.duration ?? 0,
    };
  }

  /**
   * Calculates Great-Circle distance between two coordinates in kilometers using the Haversine formula.
   */
  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private getApiKey(): string {
    const key =
      this.configService.get<string>('OPEN_ROUTE_SERVICE_API_KEY') ??
      process.env.OPEN_ROUTE_SERVICE_API_KEY;

    if (!key) {
      this.logger.warn('OPEN_ROUTE_SERVICE_API_KEY is not configured.');
    }

    return key ?? '';
  }
}
