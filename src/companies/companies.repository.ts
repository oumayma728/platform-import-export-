import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CompanyCreateInput = any;
type CompanyUpdateInput = any;

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

  async create(data: CompanyCreateInput) {
    return this.prisma.company.create({ data });
  }

  async update(id: string, data: CompanyUpdateInput) {
    return this.prisma.company.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.company.delete({ where: { id } });
  }
}
