import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CompaniesRepository } from '../companies/companies.repository';
import { CurrencyService } from '../integrations/currency/currency.service';
import {
  LogisticsEstimateResult,
  LogisticsService,
} from '../integrations/logistics/logistics.service';
import { UploadedFileLike } from '../common/types/uploaded-file.type';
import { StorageService } from '../supabase/storage.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { SearchListingsDto } from './dto/search-listing-dto';
import { UpdateListingStatusDto } from './dto/update-listing-status.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingsRepository } from './listings.repository';

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    private readonly listingsRepository: ListingsRepository,
    private readonly storageService: StorageService,
    private readonly companiesRepository: CompaniesRepository,
    private readonly currencyService: CurrencyService,
    private readonly logisticsService: LogisticsService,
  ) {}

  async create(createListingDto: CreateListingDto) {
    const company = await this.companiesRepository.findOne(
      createListingDto.companyId,
    );

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Auto-enrich priceUsd if not explicitly provided
    if (createListingDto.priceUsd === undefined && createListingDto.price && createListingDto.currency) {
      try {
        const currencyUpper = createListingDto.currency.toUpperCase();
        if (currencyUpper === 'USD') {
          createListingDto.priceUsd = createListingDto.price;
        } else {
          const conv = await this.currencyService.convert(
            createListingDto.price,
            currencyUpper,
            'USD',
          );
          createListingDto.priceUsd = conv.convertedAmount;
        }
      } catch (error) {
        this.logger.warn(`Failed to auto-convert price to USD during listing creation: ${error}`);
      }
    }

    const listing = await this.listingsRepository.create(createListingDto);

    // Auto-enrich logistics estimate if company country and listing country are available
    let logisticsEstimate: LogisticsEstimateResult | null = null;
    if (company.country && createListingDto.country) {
      try {
        logisticsEstimate = await this.logisticsService.calculate_route(
          company.country,
          createListingDto.country,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to calculate logistics estimate for new listing ${listing.id}: ${error}`,
        );
      }
    }

    return logisticsEstimate ? { ...listing, logisticsEstimate } : listing;
  }

  async findAll() {
    return this.listingsRepository.findAll();
  }

  async search(filters: SearchListingsDto) {
    const listings = await this.listingsRepository.search(filters);

    // If no currency conversion requested, return listings as-is
    if (!filters.convertTo) {
      return listings;
    }

    const targetCurrency = filters.convertTo.toUpperCase();

    // Convert each listing's price to the target currency
    const convertedListings = await Promise.all(
      listings.map(async (listing) => {
        const sourceCurrency = listing.currency?.toUpperCase();
        const price = parseFloat(String(listing.price));

        // Skip conversion if no currency info, invalid price, or same currency
        if (!sourceCurrency || isNaN(price) || sourceCurrency === targetCurrency) {
          return {
            ...listing,
            convertedPrice: isNaN(price) ? null : price,
            convertedCurrency: targetCurrency,
          };
        }

        try {
          const result = await this.currencyService.convert(
            price,
            sourceCurrency,
            targetCurrency,
          );

          return {
            ...listing,
            convertedPrice: result.convertedAmount,
            convertedCurrency: targetCurrency,
          };
        } catch (error) {
          this.logger.warn(
            `Failed to convert ${sourceCurrency} -> ${targetCurrency} for listing ${listing.id}: ${error}`,
          );
          return {
            ...listing,
            convertedPrice: null,
            convertedCurrency: targetCurrency,
          };
        }
      }),
    );

    return convertedListings;
  }

  async findOne(id: string) {
    const listing = await this.listingsRepository.findOne(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  async update(id: string, updateListingDto: UpdateListingDto) {
    const existing = await this.listingsRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Listing not found');
    }

    // If price or currency updated without priceUsd, compute priceUsd
    const effectivePrice = updateListingDto.price ?? Number(existing.price);
    const effectiveCurrency = (updateListingDto.currency ?? existing.currency)?.toUpperCase();

    if (
      updateListingDto.priceUsd === undefined &&
      (updateListingDto.price !== undefined || updateListingDto.currency !== undefined) &&
      effectiveCurrency
    ) {
      try {
        if (effectiveCurrency === 'USD') {
          updateListingDto.priceUsd = effectivePrice;
        } else {
          const conv = await this.currencyService.convert(
            effectivePrice,
            effectiveCurrency,
            'USD',
          );
          updateListingDto.priceUsd = conv.convertedAmount;
        }
      } catch (error) {
        this.logger.warn(`Failed to convert price to USD during listing update: ${error}`);
      }
    }

    const updated = await this.listingsRepository.update(id, updateListingDto);

    // Auto-enrich logistics estimate if company country and listing country are available
    let logisticsEstimate: LogisticsEstimateResult | null = null;
    const originCountry = updated.company?.country;
    const destCountry = updated.country;

    if (originCountry && destCountry) {
      try {
        logisticsEstimate = await this.logisticsService.calculate_route(
          originCountry,
          destCountry,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to calculate logistics estimate for updated listing ${id}: ${error}`,
        );
      }
    }

    return logisticsEstimate ? { ...updated, logisticsEstimate } : updated;
  }

  async updateStatus(id: string, dto: UpdateListingStatusDto) {
    const existing = await this.listingsRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Listing not found');
    }

    return this.listingsRepository.updateStatus(id, dto.status);
  }

  async addDocument(id: string, file: UploadedFileLike) {
    const existing = await this.listingsRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Listing not found');
    }

    const storagePath = `listing_${id}/${file.originalname}`;
    const bucket_name = "listing_document";
    const fileUrl = await this.storageService.uploadFile(file, storagePath, bucket_name);

    return this.listingsRepository.createDocument(id, {
      fileUrl,
      fileType: file.mimetype,
    });
  }

  async remove(id: string) {
    const existing = await this.listingsRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Listing not found');
    }

    return this.listingsRepository.remove(id);
  }
}
