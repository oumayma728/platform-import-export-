import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole,ValidationStatus } from '@prisma/client';
import argon2 from 'argon2';

import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async findAll() {
    return this.usersRepository.findAll();
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) throw new NotFoundException('User not found');

    if (updateUserDto.email) {
      const userWithSameEmail = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );

      if (userWithSameEmail && userWithSameEmail.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    const { password, ...rest } = updateUserDto;
    const updateData: Prisma.UserUncheckedUpdateInput = { ...rest };

    if (password) {
      updateData.passwordHash = await argon2.hash(password);
    }

    return this.usersRepository.updateUser(id, updateData);
  }

  async updateRole(id: string, role: UserRole) {
    const existing = await this.usersRepository.findById(id);
    if (!existing) throw new NotFoundException('User not found');

    return this.usersRepository.updateUser(id, { role });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.usersRepository.deleteUser(id);
    return true;
  }


  async suspend(params: {
    userId: string;
    adminId: string;
    motif: string;
    suspensionDurationDays: number;
  }) {
    const user = await this.usersRepository.findById(params.userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.status === ValidationStatus.SUSPENDU){
      throw new ConflictException('User account is already suspended');
    }

    const admin = await this.usersRepository.findById(params.adminId);

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return this.usersRepository.suspendUser(params);
  }
}
