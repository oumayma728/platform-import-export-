import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import argon2 from 'argon2';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  // async create(data: CreateUserDto) {
  //   const existing = await this.usersRepository.findByEmail(data.email);
  //   if (existing) throw new ConflictException('Email already in use');

  //   const passwordHash = await argon2.hash(data.password);

  //   await this.usersRepository.createUser({
  //     email: data.email,
  //     name: data.name,
  //     phone: data.phone,
  //     passwordHash,
  //   });

  //   return "user have been created !"
  // }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

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
    if (updateUserDto.email) {
      const existing = await this.usersRepository.findByEmail(updateUserDto.email);
      if (!existing) throw new NotFoundException('User not found');
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    const { phone, roles, password, ...rest } = updateUserDto as any;
    const updateData: any = { ...rest };

    if (phone) {
      updateData.phone = phone;
    }

    if (password) {
      updateData.passwordHash = await argon2.hash(password);
    }

    return this.usersRepository.updateUser(id, updateData);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.usersRepository.deleteUser(id);
  }
}

