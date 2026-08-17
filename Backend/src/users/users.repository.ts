import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

type CreateUserRepositoryInput = {
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
};

const userPublicSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  companyId: true,
  status: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: userPublicSelect,
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: userPublicSelect,
    });
  }

  async createUser(data: CreateUserRepositoryInput) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        phone: data.phone,
      },
      select: userPublicSelect,
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        passwordHash,
      },
    });
  }

  async updateUser(id: string, data: Prisma.UserUncheckedUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: userPublicSelect,
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: {
        id,
      },
      select: userPublicSelect,
    });
  }

  async emailExists(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    return !!user;
  }

 
  async suspendUser(params: {
    userId: string;
    adminId: string;
    motif?: string;
    suspensionDurationDays?: number;
  }) {
    return this.prisma.$transaction(async (tx) => {
      
      const updatedUser = await tx.user.update({
        where: { id: params.userId },
        data: { status: 'SUSPENDU' },
        select: userPublicSelect,
      });

      
      await tx.refreshToken.updateMany({
        where: { userId: params.userId, isRevoked: false },
        data: { isRevoked: true },
      });

      
      await tx.userModerationHistory.create({
        data: {
          userId: params.userId,
          adminId: params.adminId,
          motif: params.motif ?? null,
          suspensionDurationDays: params.suspensionDurationDays ?? null,
        },
      });

      return updatedUser;
    });
  }
}
