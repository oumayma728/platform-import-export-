import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { CompaniesModule } from '../../companies/companies.module';
import { UsersModule } from '../../users/users.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';


@Module({
  imports: [AuthModule, CompaniesModule, UsersModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
