import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CompaniesRepository } from './companies.repository';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Prisma, ValidationStatus, ModerationEntityType, ModerationActionType } from '@prisma/client';
import { ModerationHistoryService } from '../admin/moderation-history/moderation-history.service';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    private readonly prisma: PrismaService,
    private readonly moderationHistoryService: ModerationHistoryService,
  ) {}

  async create(userId: string, createCompanyDto: CreateCompanyDto) {
    // Only users with valide Id (exist) and dont have company can create a company
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, companyId: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.companyId) {
        throw new ConflictException('User already belongs to a company');
      }

      const company = await this.companiesRepository.create(
        createCompanyDto,
        tx,
      );

      // affect the company id to the user who made the request
      await tx.user.update({
        where: { id: userId },
        data: { companyId: company.id },
      });

      return company;
    });
  }

  async findAll() {
    return this.companiesRepository.findAll();
  }

  async findOne(id: string) {
    const company = await this.companiesRepository.findOne(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    const existing = await this.companiesRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    return this.companiesRepository.update(id, updateCompanyDto);
  }

  async remove(id: string) {
    const existing = await this.companiesRepository.findOne(id);
    if (!existing) {
      throw new NotFoundException('Company not found');
    }

    await this.companiesRepository.remove(id);

    return true;
  }

 

  async findPending(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      this.companiesRepository.findPending(skip, limit),
      this.companiesRepository.countPending(),
    ]);

    const data = companies.map((company) => ({
      id: company.id,
      name: company.name,
      country: company.country,
      description: company.description,
      createdAt: company.createdAt,
    }));

    return { data, page, limit, total };
  }


  async getDocuments(companyId: string) {
    
    const company = await this.findOne(companyId);

    const raw = company.certificationDocs;

  
    const documents = this.parseDocuments(raw);

    return {
      companyId: company.id,
      companyName: company.name,
      documents,
      total: documents.length,
    };
  }

  

  private parseDocuments(raw: unknown): Array<{
    nom_document: string;
    previewUrl: string;
    downloadUrl: string;
    date_upload: string;
  }> {
    if (!Array.isArray(raw)) return [];

    return raw.flatMap((entry: unknown) => {
      if (
        entry !== null &&
        typeof entry === 'object' &&
        !Array.isArray(entry) &&
        typeof (entry as Record<string, unknown>)['nom_document'] === 'string' &&
        typeof (entry as Record<string, unknown>)['previewUrl'] === 'string' &&
        typeof (entry as Record<string, unknown>)['downloadUrl'] === 'string' &&
        typeof (entry as Record<string, unknown>)['date_upload'] === 'string'
      ) {
        const e = entry as Record<string, string>;
        return [
          {
            nom_document: e['nom_document'],
            previewUrl: e['previewUrl'],
            downloadUrl: e['downloadUrl'],
            date_upload: e['date_upload'],
          },
        ];
      }
      return [];
    });
  }


  async verifyKyb(
    companyId: string,
    adminId: string,
    dto: import('../admin/dashboard/dto/kyb-verify.dto').KybVerifyDto,
  ) {
    await this.findOne(companyId);

    const total = dto.checklistItems.length;
    const verified = dto.checklistItems.filter((item) => item.verified).length;
    const kybScore =
      total === 0 ? 0 : Math.round((verified / total) * 100 * 100) / 100;

    const result = await this.companiesRepository.upsertKybVerification({
      companyId,
      status: dto.status,
      checklistItems: dto.checklistItems as unknown as Prisma.InputJsonValue,
      kybScore,
      verifiedAt: new Date(),
    });

    
    await this.moderationHistoryService.createModerationHistory({
      entityType: ModerationEntityType.COMPANY,
      entityId: companyId,
      actionType: ModerationActionType.KYB_VERIFICATION,
      adminId,
      details: { status: dto.status, kybScore },
    });

    return result;
  }

  


  async validate(params: {
    companyId: string;
    adminId: string;
    motif?: string;
  }) {
    const company = await this.companiesRepository.findOne(params.companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (
      company.status === ValidationStatus.VALIDE ||
      company.status === ValidationStatus.REJETE
    ) {
      throw new ConflictException(
        `Company is already ${company.status}. Cannot change status again.`,
      );
    }

    const result = await this.companiesRepository.validateCompany(params);


    await this.moderationHistoryService.createModerationHistory({
      entityType: ModerationEntityType.COMPANY,
      entityId: params.companyId,
      actionType: ModerationActionType.VALIDATION,
      adminId: params.adminId,
      details: { motif: params.motif ?? null },
    });

    return result;
  }

  

  async reject(params: {
    companyId: string;
    adminId: string;
    motif?: string;
  }) {
    const company = await this.companiesRepository.findOne(params.companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== ValidationStatus.EN_ATTENTE_VALIDATION) {
      throw new ConflictException(`Company is already ${company.status}. Cannot change status again.`);
    }

    const result = await this.companiesRepository.rejectCompany(params);

    
    await this.moderationHistoryService.createModerationHistory({
      entityType: ModerationEntityType.COMPANY,
      entityId: params.companyId,
      actionType: ModerationActionType.REJECTION,
      adminId: params.adminId,
      details: { motif: params.motif ?? null },
    });

    return result;
  }

 
  async assignBadge(params: {
    companyId: string;
    badgeType: string;
    awardedBy: string;
  }) {
    const company = await this.companiesRepository.findOne(params.companyId);
    if (!company) throw new NotFoundException('Company not found');

    const badge = await this.companiesRepository.assignBadge(params);

    
    await this.moderationHistoryService.createModerationHistory({
      entityType: ModerationEntityType.COMPANY,
      entityId: params.companyId,
      actionType: ModerationActionType.BADGE_ASSIGNED,
      adminId: params.awardedBy,
      details: { badgeType: params.badgeType },
    });

    return badge;
  }

  
  async getReviewsSummary(companyId: string) {
    const company = await this.companiesRepository.findOne(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const summary = await this.companiesRepository.getReviewsSummary(companyId);

    return {
      companyId,
      ...summary,
    };
  }

  // ─── Reputation Score ───────────────────────────────────────────────────────

  async getReputationScore(companyId: string) {
    const company = await this.companiesRepository.findOne(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const { kybScore, averageRating, reviewCount, badges, malusCount } =
      await this.companiesRepository.getReputationData(companyId);

    // Intermediate scores
    const ratingScore = averageRating !== null ? (averageRating / 5) * 100 : 0;
    const badgeScore = Math.min(badges.length * 20, 100);

    // Final reputation score — deterministic formula
    const raw =
      0.5 * kybScore +
      0.3 * ratingScore +
      0.2 * badgeScore -
      5 * malusCount;

    const finalReputationScore = Math.max(0, Math.min(100, Math.round(raw)));

    return {
      company_id: companyId,
      kyb_score: kybScore,
      average_rating: averageRating,
      review_count: reviewCount,
      badges,
      malus_count: malusCount,
      final_reputation_score: finalReputationScore,
    };
  }
}

