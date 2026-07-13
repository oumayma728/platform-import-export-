import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listing-dto';
import { ListingsRepository } from './listings.repository';

@Injectable()
export class ListingsService {
  constructor(
    private readonly listingsRepository: ListingsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createListingDto: CreateListingDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: createListingDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.listingsRepository.create({
      companyId: createListingDto.companyId,
      type: createListingDto.type,
      title: createListingDto.title,
      category: createListingDto.category,
      price: createListingDto.price,
      currency: createListingDto.currency,
      priceUsd: createListingDto.priceUsd,
      quantity: createListingDto.quantity,
      unit: createListingDto.unit,
      country: createListingDto.country,
      incoterm: createListingDto.incoterm,
      deadline: createListingDto.deadline,
      status: createListingDto.status,
    });
  }

  async findAll() {
    return this.listingsRepository.findAll();
  }

  async search(filters: SearchListingsDto) {
    return this.listingsRepository.search(filters);
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

    return this.listingsRepository.update(id, {
      ...updateListingDto,
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
