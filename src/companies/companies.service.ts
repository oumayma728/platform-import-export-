import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CompaniesRepository } from './companies.repository';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    private readonly prisma: PrismaService,
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
}
