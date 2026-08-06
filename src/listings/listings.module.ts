import { Module } from '@nestjs/common';

import { CompaniesModule } from '../companies/companies.module';
import { ListingsController } from './listings.controller';
import { ListingsRepository } from './listings.repository';
import { ListingsService } from './listings.service';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [CompaniesModule, SupabaseModule],
  controllers: [ListingsController],
  providers: [ListingsService, ListingsRepository],
  exports: [ListingsRepository],
})
export class ListingsModule {}
