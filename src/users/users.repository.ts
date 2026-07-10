import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  create(data: any) {
    return this.prisma.user.create({
      data,
    });
  }

  update(id: number, data: any) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data,
    });
  }

  delete(id: number) {
    return this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
}