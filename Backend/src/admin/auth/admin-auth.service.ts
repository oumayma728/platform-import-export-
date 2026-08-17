import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

import { UsersRepository } from '../../users/users.repository';
import { AuthService } from '../../auth/auth.service';
import { LoginDto } from '../../auth/dto/login.dto';
import { Tokens } from '../../auth/interfaces/tokens.interface';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authService: AuthService,
  ) {}


  async adminLogin(dto: LoginDto): Promise<Tokens> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Access reserved for administrators');
    }

    return this.authService.login(dto);
  }

  async adminLogout(rawRefreshToken: string): Promise<void> {
    return this.authService.logout(rawRefreshToken);
  }

  get refreshCookieMaxAgeMs(): number {
    return this.authService.refreshCookieMaxAgeMs;
  }
}
