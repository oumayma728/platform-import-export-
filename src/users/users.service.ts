import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import argon2 from 'argon2';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/update-user.dto';

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

    // extract roles and password 
    // changing the role must be from the admin only ; password must be hashed first
    const { roles, password, ...rest } = updateUserDto as any;
    const updateData: any = { ...rest };
    if (password) {
      updateData.passwordHash = await argon2.hash(password);
    }

    return this.usersRepository.updateUser(id, updateData);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.usersRepository.deleteUser(id);
    return true;
  }
}

