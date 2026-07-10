import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

// ──────────────────────────────────────────────
// In-memory user store.
// When Prisma is ready, replace each method body
// with the equivalent prisma.user.* call.
// ──────────────────────────────────────────────

export interface MockUser {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string[];
  passwordHash: string;
}

@Injectable()
export class UsersService {
  private readonly users: MockUser[] = [];

  /** Create a new user. Throws if the email is already taken. */
  create(data: {
    email: string;
    name: string;
    phoneNumber: string;
    role: string[];
    passwordHash: string;
  }): MockUser {
    const existing = this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');

    const user: MockUser = { id: randomUUID(), ...data };
    this.users.push(user);
    return user;
  }

  findByEmail(email: string): MockUser | undefined {
    return this.users.find((u) => u.email === email);
  }

  findById(id: string): MockUser | undefined {
    return this.users.find((u) => u.id === id);
  }
}
