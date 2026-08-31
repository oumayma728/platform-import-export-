import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';

import { CURRENCY_CONVERTER_API } from '../../common/constants/variables';

/** TTL for cached exchange rates (1 hour in milliseconds) */
const RATE_CACHE_TTL = 60 * 60 * 1000;

export interface ConversionResult {
  amount: number;
  from: string;
  to: string;
  convertedAmount: number;
  rate: number;
  date: string;
}

interface ExchangeRateApiResponse {
  result: 'success' | 'error';
  'error-type'?: string;
  base_code?: string;
  time_last_update_utc?: string;
  conversion_rates?: Record<string, number>;
}

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Converts an amount from one currency to another.
   * Uses cached exchange rates when available (TTL = 1 hour).
   */
  async convert(
    amount: number,
    from: string,
    to: string,
  ): Promise<ConversionResult> {
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    // Same currency — no conversion needed
    if (fromUpper === toUpper) {
      return {
        amount,
        from: fromUpper,
        to: toUpper,
        convertedAmount: amount,
        rate: 1,
        date: new Date().toISOString().split('T')[0],
      };
    }

    const { rate, date } = await this.getRate(fromUpper, toUpper);
    const convertedAmount = Math.round(amount * rate * 100) / 100;

    return {
      amount,
      from: fromUpper,
      to: toUpper,
      convertedAmount,
      rate,
      date,
    };
  }

  /**
   * Fetches the exchange rate between two currencies.
   * Checks Redis cache first; on miss, calls ExchangeRate-API.
   */
  async getRate(
    from: string,
    to: string,
  ): Promise<{ rate: number; date: string }> {
    const fromUpper = from.trim().toUpperCase();
    const toUpper = to.trim().toUpperCase();
    const cacheKey = `rate:${fromUpper}:${toUpper}`;

    // Check cache
    const cached = await this.cacheManager.get<{ rate: number; date: string }>(
      cacheKey,
    );
    if (cached) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached;
    }

    // Fetch from ExchangeRate-API
    const apiKey = this.getApiKey();
    this.logger.log(
      `Cache miss for ${cacheKey} — calling ExchangeRate-API for base ${fromUpper}`,
    );
    const url = `${CURRENCY_CONVERTER_API}/${apiKey}/latest/${fromUpper}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<ExchangeRateApiResponse>(url),
      );

      const data = response.data;

      if (data.result === 'error') {
        const errorType = data['error-type'] || 'unknown-error';
        this.logger.error(`ExchangeRate-API returned error: ${errorType}`);
        throw new BadRequestException(`ExchangeRate-API error: ${errorType}`);
      }

      const rate = data.conversion_rates?.[toUpper];
      if (rate === undefined) {
        throw new BadRequestException(
          `Currency "${toUpper}" not found in ExchangeRate-API response`,
        );
      }

      let date = new Date().toISOString().split('T')[0];
      if (data.time_last_update_utc) {
        const parsedDate = new Date(data.time_last_update_utc);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().split('T')[0];
        }
      }

      const result = { rate, date };

      // Store in Redis cache with 1 hour TTL
      await this.cacheManager.set(cacheKey, result, RATE_CACHE_TTL);
      this.logger.log(
        `Cached rate ${fromUpper}->${toUpper} = ${rate} (date: ${date})`,
      );

      return result;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const apiErrorType = error.response?.data?.['error-type'];
      const errorMessage = apiErrorType
        ? `ExchangeRate-API error: ${apiErrorType}`
        : error.message;
      this.logger.error(
        `Failed to fetch exchange rate for ${fromUpper}->${toUpper}: ${errorMessage}`,
      );
      throw new BadRequestException(errorMessage);
    }
  }

  private getApiKey(): string {
    const key =
      this.configService.get<string>('CURRENCY_CONVERTER_API_KEY') ??
      process.env.CURRENCY_CONVERTER_API_KEY;

    if (!key) {
      this.logger.error('CURRENCY_CONVERTER_API_KEY is not configured.');
      throw new BadRequestException(
        'CURRENCY_CONVERTER_API_KEY is not configured.',
      );
    }

    return key;
  }
}
