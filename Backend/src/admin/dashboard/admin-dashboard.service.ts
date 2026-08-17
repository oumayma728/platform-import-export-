import { Injectable } from '@nestjs/common';
import { ListingStatus, Prisma, ValidationStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  AdminCompaniesResponseDto,
  AdminUsersResponseDto,
} from './dto/admin-dashboard-response.dto';
import { DashboardFiltersDto } from './dto/dashboard-filters.dto';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

 
  async getUsers(
    filters: DashboardFiltersDto,
  ): Promise<AdminUsersResponseDto> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    
    const where: Prisma.UserWhereInput = {};

    
    if (filters.status) {
      where.status = filters.status;
    }

    
    if (filters.country || filters.sector) {
      where.company = {};
      if (filters.country) where.company.country = filters.country;
      if (filters.sector) where.company.sector = filters.sector;
    }

    
    if (filters.date_from || filters.date_to) {
      where.createdAt = {};
      if (filters.date_from) where.createdAt.gte = new Date(filters.date_from);
      if (filters.date_to) where.createdAt.lte = new Date(filters.date_to);
    }
    

    const [users, total, statusCounts] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          companyId: true,
          createdAt: true,
        },
      }),

      this.prisma.user.count({ where }),

      this.prisma.user.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    const countsMap = statusCounts.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.status] = row._count.status;
        return acc;
      },
      {},
    );

    return {
      data: users,
      statusCounts: {
        VALIDE: countsMap[ValidationStatus.VALIDE] ?? 0,
        EN_ATTENTE_VALIDATION:
          countsMap[ValidationStatus.EN_ATTENTE_VALIDATION] ?? 0,
        REJETE: countsMap[ValidationStatus.REJETE] ?? 0,
        SUSPENDU: countsMap[ValidationStatus.SUSPENDU] ?? 0,
      },
      page,
      limit,
      total,
    };
  }

  

  async getCompanies(
    filters: DashboardFiltersDto,
  ): Promise<AdminCompaniesResponseDto> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    
    const where: Prisma.CompanyWhereInput = {};

    
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.country) {
      where.country = filters.country;
    }

    if (filters.sector) {
      where.sector = filters.sector;
    }

    
    if (filters.date_from || filters.date_to) {
      where.createdAt = {};
      if (filters.date_from) where.createdAt.gte = new Date(filters.date_from);
      if (filters.date_to) where.createdAt.lte = new Date(filters.date_to);
    }
    

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          country: true,
          sector: true,
          description: true,
          createdAt: true,
          _count: {
            select: {
              listings: {
                where: { status: ListingStatus.ACTIVE },
              },
            },
          },
        },
      }),

      this.prisma.company.count({ where }),
    ]);

    const data = companies.map((company) => ({
      id: company.id,
      name: company.name,
      country: company.country,
      sector: company.sector ?? null,
      description: company.description,
      createdAt: company.createdAt,
      activeListings: company._count.listings,
    }));

    return {
      data,
      page,
      limit,
      total,
    };
  }
}
