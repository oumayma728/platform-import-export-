import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { UsersModule } from '../../users/users.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
