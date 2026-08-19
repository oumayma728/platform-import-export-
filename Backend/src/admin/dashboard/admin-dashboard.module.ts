import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { CompaniesModule } from '../../companies/companies.module';
import { UsersModule } from '../../users/users.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';


import { ModerationHistoryModule } from '../moderation-history/moderation-history.module';

@Module({
  imports: [AuthModule, CompaniesModule, UsersModule, ModerationHistoryModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
