import { Injectable } from '@nestjs/common';
import { ListingStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { SearchListingsDto } from './dto/search-listing-dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@Injectable()
export class ListingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.listing.findMany({
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(filters: SearchListingsDto) {
    const where: Prisma.ListingWhereInput = {};

    if (filters.country) {
      where.country = { contains: filters.country, mode: 'insensitive' };
    }

    if (filters.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceFilter: Prisma.DecimalFilter = {};

      if (filters.minPrice !== undefined) {
        priceFilter.gte = filters.minPrice;
      }

      if (filters.maxPrice !== undefined) {
        priceFilter.lte = filters.maxPrice;
      }

      where.price = priceFilter;
    }

    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { category: { contains: filters.q, mode: 'insensitive' } },
        { country: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const listings = await this.prisma.listing.findMany({
      where,
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!filters.certification) {
      return listings;
    }

    const certificationFilter = filters.certification.trim().toLowerCase();

    return listings.filter((listing) => {
      const docsText =
        typeof listing.company.certificationDocs === 'string'
          ? listing.company.certificationDocs
          : JSON.stringify(listing.company.certificationDocs ?? '');

      return [
        listing.company.description,
        listing.company.registrationNumber,
        docsText,
      ]
        .filter(Boolean)
        .some((value) =>
          value?.toString().toLowerCase().includes(certificationFilter),
        );
    });
  }

  async findOne(id: string) {
    return this.prisma.listing.findUnique({
      where: { id },
      include: { company: true },
    });
  }

  async create(data: CreateListingDto) {
    const normalizedData: Prisma.ListingUncheckedCreateInput = { ...data };

    if (data.deadline !== undefined) {
      normalizedData.deadline = data.deadline
        ? new Date(data.deadline)
        : undefined;
    }

    return this.prisma.listing.create({
      data: normalizedData,
      include: { company: true },
    });
  }

  async update(id: string, data: UpdateListingDto) {
    const normalizedData: Prisma.ListingUncheckedUpdateInput = { ...data };

    if (data.deadline !== undefined) {
      normalizedData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    return this.prisma.listing.update({
      where: { id },
      data: normalizedData,
      include: { company: true },
    });
  }

  async updateStatus(id: string, status: ListingStatus) {
    return this.prisma.listing.update({
      where: { id },
      data: { status },
      include: { company: true },
    });
  }

  async remove(id: string) {
    return this.prisma.listing.delete({
      where: { id },
      include: { company: true },
    });
  }
}
