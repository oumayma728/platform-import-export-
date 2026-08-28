import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import {
  SMS_PROVIDER,
  SMS_QUEUE_NAME,
} from '../../../common/constants/variables';
import type { ISmsProvider } from '../interfaces/sms-provider.interface';
import type { SmsJobData } from '../interfaces/notification-job.interface';
import { NotificationsRepository } from '../notifications.repository';
import { NotificationStatus } from '@prisma/client';

@Processor(SMS_QUEUE_NAME)
export class SmsProcessor extends WorkerHost {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    @Inject(SMS_PROVIDER) private readonly smsProvider: ISmsProvider,
    private readonly notificationsRepository: NotificationsRepository,
  ) {
    super();
  }

  async process(job: Job<SmsJobData>): Promise<unknown> {
    const { logId, phone, message } = job.data;
    const attemptNumber = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts || 3;

    this.logger.log(
      `Processing SMS job ${job.id} (Log: ${logId}) to ${phone} (Attempt ${attemptNumber}/${maxAttempts})`,
    );

    try {
      if (job.attemptsMade > 0) {
        await this.notificationsRepository.updateStatus(
          logId,
          NotificationStatus.RETRYING,
          {
            lastAttemptAt: new Date(),
            attempts: attemptNumber,
          },
        );
      }

      const result = await this.smsProvider.sendSms({
        to: phone,
        message,
      });

      await this.notificationsRepository.updateStatus(
        logId,
        NotificationStatus.SENT,
        {
          sentAt: new Date(),
          lastAttemptAt: new Date(),
          attempts: attemptNumber,
          errorMessage: null,
        },
      );

      this.logger.log(
        `SMS job ${job.id} succeeded for log ${logId} (MessageId: ${result.messageId})`,
      );
      return result;
    } catch (error: any) {
      const isFinalFailure = attemptNumber >= maxAttempts;

      await this.notificationsRepository.incrementAttempt(logId, {
        errorMessage: error.message || 'Unknown SMS delivery failure',
        isFinalFailure,
      });

      this.logger.error(
        `SMS job ${job.id} attempt ${attemptNumber} failed: ${error.message}`,
        error.stack,
      );

      // Re-throw so BullMQ can trigger exponential backoff retry if attempts remain
      throw error;
    }
  }
}
