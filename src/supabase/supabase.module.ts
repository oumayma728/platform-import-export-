import { Module } from '@nestjs/common';

import { StorageService } from './storage.service';
import { SupabaseService } from './supabase.service';

@Module({
  providers: [SupabaseService, StorageService],
  exports: [SupabaseService, StorageService],
})
export class SupabaseModule {}
