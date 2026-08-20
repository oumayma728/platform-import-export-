import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
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

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
   * Checks Redis cache first; on miss, calls the Frankfurter API.
   */
  async getRate(
    from: string,
    to: string,
  ): Promise<{ rate: number; date: string }> {
    const cacheKey = `rate:${from}:${to}`;

    // Check cache
    const cached = await this.cacheManager.get<{ rate: number; date: string }>(
      cacheKey,
    );
    if (cached) {
      this.logger.debug(`Cache hit for ${cacheKey}`);
      return cached;
    }

    // Fetch from Frankfurter API
    this.logger.log(`Cache miss for ${cacheKey} — calling Frankfurter API`);
    const url = `${CURRENCY_CONVERTER_API}/latest?amount=1&from=${from}&to=${to}`;

    const { data } = await firstValueFrom(
      this.httpService.get<{
        amount: number;
        base: string;
        date: string;
        rates: Record<string, number>;
      }>(url),
    );

    const rate = data.rates[to];
    if (rate === undefined) {
      throw new Error(
        `Currency "${to}" not found in Frankfurter API response`,
      );
    }

    const result = { rate, date: data.date };

    // Store in Redis cache with 1 hour TTL
    await this.cacheManager.set(cacheKey, result, RATE_CACHE_TTL);
    this.logger.log(`Cached rate ${from}->${to} = ${rate} (date: ${data.date})`);

    return result;
  }
}
