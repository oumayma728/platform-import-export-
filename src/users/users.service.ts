import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /** Create a new user. Throws if the email is already taken. */
  async create(data: CreateUserDto) {
    const existing = await this.usersRepository.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');

    return this.usersRepository.createUser({
      email: data.email,
      name: data.name,
      phone: data.phoneNumber,
      roles: data.role,
      passwordHash: data.passwordHash,
    });
  }

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
    // If updating email, check if it's already in use by another user
    if (updateUserDto.email) {
      const existing = await this.usersRepository.findByEmail(updateUserDto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }
    
    // Map DTO properties if necessary
    const { phoneNumber, role, ...rest } = updateUserDto as any;
    const updateData: any = { ...rest };
    if (phoneNumber) {
      updateData.phone = phoneNumber;
    }
    // Note: Roles creation/linking for company is skipped or handled on update context.
    
    return this.usersRepository.updateUser(id, updateData);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.usersRepository.deleteUser(id);
  }
}

