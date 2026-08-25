import { Injectable } from '@nestjs/common';
import { ModerationActionType, ModerationEntityType, Prisma, ValidationStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.company.findUnique({ where: { id } });
  }

  async create(data: CreateCompanyDto, tx: Prisma.TransactionClient) {
    const { certificationDocs, ...rest } = data;

    const normalizedData: Prisma.CompanyCreateInput = {
      ...rest,
    };

    if (certificationDocs !== undefined) {
      normalizedData.certificationDocs =
        certificationDocs as Prisma.InputJsonValue;
    }

    return tx.company.create({
      data: normalizedData,
    });
  }

  async update(id: string, data: UpdateCompanyDto) {
    const { certificationDocs, ...rest } = data;
    const normalizedData: Prisma.CompanyUpdateInput = { ...rest };

    if (certificationDocs !== undefined) {
      normalizedData.certificationDocs =
        certificationDocs as Prisma.InputJsonValue;
    }

    return this.prisma.company.update({ where: { id }, data: normalizedData });
  }

  async remove(id: string) {
    return this.prisma.company.delete({ where: { id } });
  }

  async findPending(skip: number, take: number) {
    return this.prisma.company.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      where: {
      status: ValidationStatus.EN_ATTENTE_VALIDATION,
      },
      select: {
          id: true,
          name: true,
          country: true,
          description: true,
         createdAt: true,
        
      },
    });
  }   

 
  async countPending() {
  return this.prisma.company.count({
    where: {
      status: ValidationStatus.EN_ATTENTE_VALIDATION,
    },
  });
  }

  
  async upsertKybVerification(params: {
    companyId: string;
    status: import('@prisma/client').KybStatus;
    checklistItems: import('@prisma/client').Prisma.InputJsonValue;
    kybScore: number;
    verifiedAt: Date;
  }) {
    return this.prisma.kybVerification.upsert({
      where: { companyId: params.companyId },
      create: {
        companyId: params.companyId,
        status: params.status,
        checklistItems: params.checklistItems,
        kybScore: params.kybScore,
        verifiedAt: params.verifiedAt,
      },
      update: {
        status: params.status,
        checklistItems: params.checklistItems,
        kybScore: params.kybScore,
        verifiedAt: params.verifiedAt,
      },
    });
  }


  async validateCompany(params: {
    companyId: string;
    adminId: string;
    motif?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      
      const updatedCompany = await tx.company.update({
        where: { id: params.companyId },
        data: { status: ValidationStatus.VALIDE },
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
        },
      });

     
      await tx.companyValidationHistory.create({
        data: {
          companyId: params.companyId,
          adminId: params.adminId,
          status: ValidationStatus.VALIDE,
          motif: params.motif ?? null,
          validatedAt: new Date(),
        },
      });

      return updatedCompany;
    });
  }

 

  async rejectCompany(params: {
    companyId: string;
    adminId: string;
    motif?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      
      const updatedCompany = await tx.company.update({
        where: { id: params.companyId },
        data: { status: ValidationStatus.REJETE },
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
        },
      });

      
      await tx.companyValidationHistory.create({
        data: {
          companyId: params.companyId,
          adminId: params.adminId,
          status: ValidationStatus.REJETE,
          motif: params.motif ?? null,
          validatedAt: new Date(),
        },
      });

      return updatedCompany;
    });
  }

  
  async assignBadge(params: {
    companyId: string;
    badgeType: string;
    awardedBy: string;
  }) {
    return this.prisma.companyBadge.create({
      data: {
        companyId: params.companyId,
        badgeType: params.badgeType,
        awardedBy: params.awardedBy,
        awardedAt: new Date(),
      },
    });
  }

  
  async getReviewsSummary(
    companyId: string,
  ): Promise<{ averageRating: number | null; reviewCount: number }> {
    const result = await this.prisma.review.aggregate({
      where: { companyId },
      _avg: { rating: true },
      _count: { id: true },
    });

    return {
      averageRating:
        result._avg.rating !== null
          ? Math.round(result._avg.rating * 100) / 100
          : null,
      reviewCount: result._count.id,
    };
  }

  // ─── Reputation Score ───────────────────────────────────────────────────────

  async getReputationData(companyId: string): Promise<{
    kybScore: number;
    averageRating: number | null;
    reviewCount: number;
    badges: string[];
    malusCount: number;
  }> {
    const [kyb, reviewAgg, badgeList, malusAgg] = await Promise.all([
      // KYB score (null if not verified yet)
      this.prisma.kybVerification.findUnique({
        where: { companyId },
        select: { kybScore: true },
      }),

      // Average rating + review count
      this.prisma.review.aggregate({
        where: { companyId },
        _avg: { rating: true },
        _count: { id: true },
      }),

      // All badges assigned to this company
      this.prisma.companyBadge.findMany({
        where: { companyId },
        select: { badgeType: true },
      }),

      // Malus = count of REJECTION actions in moderation_history for this company
      this.prisma.moderationHistory.count({
        where: {
          entityType: ModerationEntityType.COMPANY,
          entityId: companyId,
          actionType: ModerationActionType.REJECTION,
        },
      }),
    ]);

    return {
      kybScore: kyb?.kybScore ?? 0,
      averageRating:
        reviewAgg._avg.rating !== null
          ? Math.round(reviewAgg._avg.rating * 100) / 100
          : null,
      reviewCount: reviewAgg._count.id,
      badges: badgeList.map((b) => b.badgeType),
      malusCount: malusAgg,
    };
  }
}

