import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationsController } from './notifications.controller';
import { SmsService } from './sms.service';

@Module({
  controllers: [NotificationsController],
  providers: [EmailService, SmsService],
  exports: [EmailService],
})
export class NotificationsModule {}
