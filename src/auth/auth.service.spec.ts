import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../users/users.repository';
import { RefreshTokensService } from './refresh-tokens.service';
import { NotificationsService } from '../integrations/notifications/notifications.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn(), getOrThrow: jest.fn() } },
        { provide: UsersRepository, useValue: { findByEmail: jest.fn(), createUser: jest.fn(), findById: jest.fn() } },
        { provide: RefreshTokensService, useValue: { create: jest.fn(), findById: jest.fn(), revoke: jest.fn(), revokeAllForUser: jest.fn() } },
        { provide: NotificationsService, useValue: { sendWelcomeNotification: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
