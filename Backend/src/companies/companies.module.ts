import { Module } from '@nestjs/common';

import { ModerationHistoryModule } from '../admin/moderation-history/moderation-history.module';
import { CompaniesController } from './companies.controller';
import { CompaniesRepository } from './companies.repository';
import { CompaniesService } from './companies.service';

@Module({
  imports: [ModerationHistoryModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, CompaniesRepository],
  exports: [CompaniesService],
})
export class CompaniesModule {}
