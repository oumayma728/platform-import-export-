import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  EMAIL_QUEUE_NAME,
  SMS_QUEUE_NAME,
} from '../../common/constants/variables';
import type {
  EmailJobData,
  SmsJobData,
} from './interfaces/notification-job.interface';
import { NotificationsRepository } from './notifications.repository';
import {
  NotificationChannel,
  NotificationStatus,
  type ValidationStatus,
} from '@prisma/client';

export interface SendEmailOptions {
  userId?: string;
  html?: string;
  metadata?: Record<string, unknown>;
}

export interface SendSmsOptions {
  userId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE_NAME)
    private readonly emailQueue: Queue<EmailJobData>,
    @InjectQueue(SMS_QUEUE_NAME)
    private readonly smsQueue: Queue<SmsJobData>,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  /**
   * Primary method to send an email asynchronously via BullMQ.
   * Matches required specification: send_email(to, subject, body)
   */
  async send_email(
    to: string,
    subject: string,
    body: string,
    options?: SendEmailOptions,
  ) {
    const log = await this.notificationsRepository.createLog({
      userId: options?.userId,
      channel: NotificationChannel.EMAIL,
      recipient: to,
      subject,
      content: body,
      provider: 'bird',
      status: NotificationStatus.PENDING,
      metadata: (options?.metadata as any) ?? null,
    });

    await this.emailQueue.add(
      'send-email',
      {
        logId: log.id,
        to,
        subject,
        body,
        html: options?.html,
        userId: options?.userId,
      },
      {
        jobId: `email-${log.id}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(`Email enqueued for ${to} (Log ID: ${log.id})`);
    return log;
  }

  /**
   * CamelCase alias for send_email
   */
  async sendEmail(
    to: string,
    subject: string,
    body: string,
    options?: SendEmailOptions,
  ) {
    return this.send_email(to, subject, body, options);
  }

  /**
   * Primary method to send an SMS asynchronously via BullMQ.
   * Matches required specification: send_sms(phone, message)
   */
  async send_sms(phone: string, message: string, options?: SendSmsOptions) {
    const log = await this.notificationsRepository.createLog({
      userId: options?.userId,
      channel: NotificationChannel.SMS,
      recipient: phone,
      subject: null,
      content: message,
      provider: 'bird',
      status: NotificationStatus.PENDING,
      metadata: (options?.metadata as any) ?? null,
    });

    await this.smsQueue.add(
      'send-sms',
      {
        logId: log.id,
        phone,
        message,
        userId: options?.userId,
      },
      {
        jobId: `sms-${log.id}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(`SMS enqueued for ${phone} (Log ID: ${log.id})`);
    return log;
  }

  /**
   * CamelCase alias for send_sms
   */
  async sendSms(phone: string, message: string, options?: SendSmsOptions) {
    return this.send_sms(phone, message, options);
  }

  // ============================================================
  // RETRY & AUDITING LOGIC
  // ============================================================

  /**
   * Re-enqueues a failed notification log for retry
   */
  async retryNotification(logId: string) {
    const log = await this.notificationsRepository.findById(logId);
    if (!log) {
      throw new NotFoundException(`Notification log ${logId} not found`);
    }

    if (log.status !== NotificationStatus.FAILED) {
      throw new BadRequestException(
        `Cannot retry notification with status '${log.status}'. Only FAILED notifications can be retried.`,
      );
    }

    await this.notificationsRepository.updateStatus(
      logId,
      NotificationStatus.PENDING,
      {
        errorMessage: null,
      },
    );

    if (log.channel === NotificationChannel.EMAIL) {
      await this.emailQueue.add(
        'send-email',
        {
          logId: log.id,
          to: log.recipient,
          subject: log.subject || '',
          body: log.content,
          userId: log.userId ?? undefined,
        },
        {
          jobId: `email-${log.id}-retry-${Date.now()}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    } else if (log.channel === NotificationChannel.SMS) {
      await this.smsQueue.add(
        'send-sms',
        {
          logId: log.id,
          phone: log.recipient,
          message: log.content,
          userId: log.userId ?? undefined,
        },
        {
          jobId: `sms-${log.id}-retry-${Date.now()}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    }

    this.logger.log(`Manually re-enqueued failed notification ${logId}`);
    return this.notificationsRepository.findById(logId);
  }

  /**
   * Retries all failed notifications up to a limit
   */
  async retryAllFailed(limit = 50) {
    const failedLogs = await this.notificationsRepository.findFailed(limit);
    let retriedCount = 0;

    for (const log of failedLogs) {
      try {
        await this.retryNotification(log.id);
        retriedCount++;
      } catch (err: any) {
        this.logger.error(
          `Failed to retry notification ${log.id}: ${err.message}`,
        );
      }
    }

    return { retriedCount, totalFailedFound: failedLogs.length };
  }

  async getNotificationLogs(params: {
    userId?: string;
    channel?: NotificationChannel;
    status?: NotificationStatus;
    skip?: number;
    take?: number;
  }) {
    return this.notificationsRepository.findLogs(params);
  }

  async getNotificationLogById(id: string) {
    const log = await this.notificationsRepository.findById(id);
    if (!log) {
      throw new NotFoundException(`Notification log ${id} not found`);
    }
    return log;
  }

  // ============================================================
  // DOMAIN EVENT NOTIFICATIONS
  // ============================================================

  /**
   * Triggered on user registration (POST /auth/register)
   */
  async sendWelcomeNotification(user: {
    id: string;
    email: string;
    phone?: string;
    name: string;
  }) {
    const subject = 'Bienvenue sur notre plateforme !';
    const body = `Bonjour ${user.name},\n\nVotre compte a été créé avec succès. Vous pouvez dès maintenant explorer nos annonces, proposer des offres et échanger avec nos partenaires commerciaux certifiés.\n\nCordialement,\nL'équipe Import-Export`;

    const emailPromise = this.send_email(user.email, subject, body, {
      userId: user.id,
      metadata: { event: 'USER_REGISTERED' },
    });

    let smsPromise: Promise<any> | null = null;
    if (user.phone) {
      const smsText = `Bienvenue ${user.name}! Votre inscription a été enregistrée avec succès.`;
      smsPromise = this.send_sms(user.phone, smsText, {
        userId: user.id,
        metadata: { event: 'USER_REGISTERED' },
      }).catch((err) => {
        this.logger.warn(`Welcome SMS failed to enqueue: ${err.message}`);
      });
    }

    return Promise.all([emailPromise, smsPromise]);
  }

  /**
   * Triggered on new incoming chat message (POST /messaging/conversations/:id/messages)
   */
  async sendNewMessageNotification(
    recipient: {
      id: string;
      email: string;
      phone?: string;
      name: string;
    },
    senderName: string,
    conversationId: string,
    messagePreview: string,
  ) {
    const subject = `Nouveau message de ${senderName}`;
    const snippet =
      messagePreview.length > 100
        ? `${messagePreview.substring(0, 97)}...`
        : messagePreview;

    const body = `Bonjour ${recipient.name},\n\nVous avez reçu un nouveau message de la part de ${senderName} concernant votre négociation en cours :\n\n"${snippet}"\n\nConnectez-vous à votre espace pour répondre.\n\nCordialement,\nL'équipe Import-Export`;

    return this.send_email(recipient.email, subject, body, {
      userId: recipient.id,
      metadata: {
        event: 'NEW_MESSAGE',
        conversationId,
        senderName,
      },
    });
  }

  /**
   * Triggered on confirmed payment / invoice (POST /billing/webhook)
   */
  async sendPaymentConfirmationNotification(
    user: {
      id: string;
      email: string;
      name: string;
    },
    details: {
      amount: number;
      currency: string;
      type: string;
      invoiceId?: string;
      paymentIntentId?: string;
    },
  ) {
    const formattedAmount = `${details.amount.toFixed(2)} ${details.currency.toUpperCase()}`;
    const subject = `Confirmation de votre paiement (${formattedAmount})`;
    const body = `Bonjour ${user.name},\n\nNous vous confirmons la bonne réception de votre paiement d'un montant de ${formattedAmount} (${details.type}).\n\nVotre accès aux services associés a été activé.\n\nMerci pour votre confiance.\nL'équipe Import-Export`;

    return this.send_email(user.email, subject, body, {
      userId: user.id,
      metadata: {
        event: 'PAYMENT_CONFIRMED',
        ...details,
      },
    });
  }

  /**
   * Triggered when a new matching proposal/conversation is suggested
   */
  async sendMatchingSuggestionNotification(
    user: {
      id: string;
      email: string;
      name: string;
    },
    listingTitle: string,
    conversationId: string,
  ) {
    const subject = 'Nouvelle opportunité de matching commercial détectée';
    const body = `Bonjour ${user.name},\n\nUn nouveau partenaire potentiel a été identifié pour votre annonce "${listingTitle}".\n\nUne suggestion de mise en relation a été générée. Rendez-vous dans votre espace Messagerie pour entamer la négociation.\n\nCordialement,\nL'équipe Import-Export`;

    return this.send_email(user.email, subject, body, {
      userId: user.id,
      metadata: {
        event: 'MATCHING_PROPOSAL',
        listingTitle,
        conversationId,
      },
    });
  }

  /**
   * Triggered when free conversation quota (50 chats) is reached
   */
  async sendFreeQuotaExceededNotification(user: {
    id: string;
    email: string;
    name: string;
  }) {
    const subject = 'Votre quota gratuit de conversations a été atteint';
    const body = `Bonjour ${user.name},\n\nVous avez utilisé la totalité de vos 50 conversations gratuites sur la plateforme Import-Export.\n\nPour continuer à initier de nouvelles conversations avec nos partenaires, vous pouvez soit souscrire à un abonnement mensuel/annuel illimité, soit débloquer des conversations à l'unité (2 $ / conversation).\n\nCordialement,\nL'équipe Import-Export`;

    return this.send_email(user.email, subject, body, {
      userId: user.id,
      metadata: {
        event: 'QUOTA_EXCEEDED',
      },
    });
  }

  /**
   * Triggered when company registration is validated or rejected by Admin
   */
  async sendCompanyValidationNotification(
    user: {
      id: string;
      email: string;
      name: string;
    },
    companyName: string,
    status: ValidationStatus,
  ) {
    const isApproved = status === 'VALIDE';
    const subject = isApproved
      ? `Validation de votre entreprise ${companyName}`
      : `Statut de votre entreprise ${companyName} : ${status}`;

    const body = isApproved
      ? `Bonjour ${user.name},\n\nFélicitations ! Votre entreprise "${companyName}" a été validée par nos administrateurs. Vous pouvez désormais publier des annonces et démarrer des échanges commerciaux.\n\nCordialement,\nL'équipe Import-Export`
      : `Bonjour ${user.name},\n\nLe statut de vérification de votre entreprise "${companyName}" a été mis à jour : ${status}.\nVeuillez consulter vos documents ou contacter notre support.\n\nCordialement,\nL'équipe Import-Export`;

    return this.send_email(user.email, subject, body, {
      userId: user.id,
      metadata: {
        event: 'COMPANY_VALIDATION_UPDATED',
        companyName,
        status,
      },
    });
  }

}
