import { Injectable } from '@nestjs/common';
import { ListingStatus, ListingType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchListingsDto } from './dto/search-listing-dto';

type ListingCreateInput = {
  companyId: string;
  type: ListingType;
  title: string;
  category: string;
  price: number;
  currency: string;
  priceUsd?: number | null;
  quantity: number;
  unit: string;
  country: string;
  incoterm: string;
  deadline?: Date | string | null;
  status?: ListingStatus;
};

type ListingUpdateInput = Partial<ListingCreateInput>;

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
    const where: any = {};

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
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
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
      const company = listing.company as { description?: string | null; registrationNumber?: string | null; certificationDocs?: unknown };
      const docsText =
        typeof company.certificationDocs === 'string'
          ? company.certificationDocs
          : JSON.stringify(company.certificationDocs ?? '');

      return [company.description, company.registrationNumber, docsText]
        .filter(Boolean)
        .some((value) => value?.toString().toLowerCase().includes(certificationFilter));
    });
  }

  async findOne(id: string) {
    return this.prisma.listing.findUnique({
      where: { id },
      include: { company: true },
    });
  }

  async create(data: ListingCreateInput) {
    const normalizedData: Record<string, unknown> = { ...data };
    if ('deadline' in data) {
      normalizedData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    return this.prisma.listing.create({
      data: normalizedData as any,
      include: { company: true },
    });
  }

  async update(id: string, data: ListingUpdateInput) {
    const normalizedData: Record<string, unknown> = { ...data };
    if ('deadline' in data) {
      normalizedData.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    return this.prisma.listing.update({
      where: { id },
      data: normalizedData as any,
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
