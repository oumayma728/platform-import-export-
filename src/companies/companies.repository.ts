import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

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
}
