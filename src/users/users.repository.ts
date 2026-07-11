import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Find user by email (login, register checks)
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  // Find user by id (JWT validation)
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        companyId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Find all users (standard Admin query)
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        companyId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Create new user (register)
  async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    phone: string;
    roles?: string[];
  }) {
    let companyId: string | undefined;

    if (data.roles && data.roles.length > 0) {
      const isExporter = data.roles.includes('EXPORTEUR');
      const isImporter = data.roles.includes('IMPORTEUR');

      const company = await this.prisma.company.create({
        data: {
          name: `${data.name}'s Company`,
          isExporter,
          isImporter,
          country: 'Unknown',
        },
      });
      companyId = company.id;
    }

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        phone: data.phone,
        companyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        companyId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Update password (reset password)
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

  // Update user fields
  async updateUser(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        companyId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Delete user
  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        companyId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Check if email exists
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
}
