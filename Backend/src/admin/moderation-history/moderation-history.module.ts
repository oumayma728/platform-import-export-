import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { ModerationHistoryController } from './moderation-history.controller';
import { ModerationHistoryRepository } from './moderation-history.repository';
import { ModerationHistoryService } from './moderation-history.service';


@Module({
  imports: [AuthModule],
  controllers: [ModerationHistoryController],
  providers: [ModerationHistoryService, ModerationHistoryRepository],
  exports: [ModerationHistoryService],
})
export class ModerationHistoryModule {}
