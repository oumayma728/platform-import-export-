import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import {
  EMAIL_PROVIDER,
  EMAIL_QUEUE_NAME,
} from '../../../common/constants/variables';
import type { IEmailProvider } from '../interfaces/email-provider.interface';
import type { EmailJobData } from '../interfaces/notification-job.interface';
import { NotificationsRepository } from '../notifications.repository';
import { NotificationStatus } from '@prisma/client';

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: IEmailProvider,
    private readonly notificationsRepository: NotificationsRepository,
  ) {
    super();
  }

  async process(job: Job<EmailJobData>): Promise<unknown> {
    const { logId, to, subject, body, html } = job.data;
    const attemptNumber = job.attemptsMade + 1;
    const maxAttempts = job.opts.attempts || 3;

    this.logger.log(
      `Processing email job ${job.id} (Log: ${logId}) to ${to} (Attempt ${attemptNumber}/${maxAttempts})`,
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

      const result = await this.emailProvider.sendEmail({
        to,
        subject,
        body,
        html,
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
        `Email job ${job.id} succeeded for log ${logId} (MessageId: ${result.messageId})`,
      );
      return result;
    } catch (error: any) {
      const isFinalFailure = attemptNumber >= maxAttempts;

      await this.notificationsRepository.incrementAttempt(logId, {
        errorMessage: error.message || 'Unknown email delivery failure',
        isFinalFailure,
      });

      this.logger.error(
        `Email job ${job.id} attempt ${attemptNumber} failed: ${error.message}`,
        error.stack,
      );

      // Re-throw so BullMQ can trigger exponential backoff retry if attempts remain
      throw error;
    }
  }
}
