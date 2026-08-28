import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  EMAIL_PROVIDER,
  SMS_PROVIDER,
  EMAIL_QUEUE_NAME,
  SMS_QUEUE_NAME,
} from '../../common/constants/variables';
import { BirdEmailProvider } from './providers/bird-email.provider';
import { BirdSmsProvider } from './providers/bird-sms.provider';
import { EmailProcessor } from './processors/email.processor';
import { SmsProcessor } from './processors/sms.processor';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      {
        name: EMAIL_QUEUE_NAME,
        // add DLQ
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnFail: false,
        },
      },
      {
        name: SMS_QUEUE_NAME,
        // add DLQ
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnFail: false,
        },
      },
    ),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsRepository,
    NotificationsService,
    EmailService,
    SmsService,
    BirdEmailProvider,
    BirdSmsProvider,
    {
      provide: EMAIL_PROVIDER,
      useExisting: BirdEmailProvider,
    },
    {
      provide: SMS_PROVIDER,
      useExisting: BirdSmsProvider,
    },
    EmailProcessor,
    SmsProcessor,
  ],
  exports: [
    NotificationsService,
    NotificationsRepository,
    EmailService,
    SmsService,
    EMAIL_PROVIDER,
    SMS_PROVIDER,
  ],
})
export class NotificationsModule {}
