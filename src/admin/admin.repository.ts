import { Injectable } from '@nestjs/common';
import { ValidationStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCompanies(status?: ValidationStatus) {
    const filterStatus = status ?? ValidationStatus.EN_ATTENTE_VALIDATION;

    return this.prisma.company.findMany({
      where: {
        validationStatus: filterStatus,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findCompanyById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  async updateCompanyStatus(id: string, status: ValidationStatus) {
    return this.prisma.company.update({
      where: { id },
      data: {
        validationStatus: status,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }
}
