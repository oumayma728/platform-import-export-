import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { CompaniesRepository } from '../companies/companies.repository';
import { CurrencyService } from '../integrations/currency/currency.service';
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
  ) {}
  

  async create(createListingDto: CreateListingDto) {
    const company = await this.companiesRepository.findOne(
      createListingDto.companyId,
    );

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.listingsRepository.create(createListingDto);
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

    return this.listingsRepository.update(id, updateListingDto);
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
