import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import {
  EMAIL_QUEUE_NAME,
  SMS_QUEUE_NAME,
} from './constants/notification.constants';
import {
  NotificationChannel,
  NotificationStatus,
  ValidationStatus,
} from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let emailQueue: { add: jest.Mock };
  let smsQueue: { add: jest.Mock };
  let repo: {
    createLog: jest.Mock;
    findById: jest.Mock;
    updateStatus: jest.Mock;
    findFailed: jest.Mock;
    findLogs: jest.Mock;
  };

  beforeEach(async () => {
    emailQueue = { add: jest.fn().mockResolvedValue({ id: 'job-email-1' }) };
    smsQueue = { add: jest.fn().mockResolvedValue({ id: 'job-sms-1' }) };
    repo = {
      createLog: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findFailed: jest.fn(),
      findLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getQueueToken(EMAIL_QUEUE_NAME), useValue: emailQueue },
        { provide: getQueueToken(SMS_QUEUE_NAME), useValue: smsQueue },
        { provide: NotificationsRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send_email / sendEmail', () => {
    it('creates a NotificationLog and enqueues an email job in BullMQ', async () => {
      const mockLog = {
        id: 'log-123',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        subject: 'Welcome',
        content: 'Welcome message',
        status: NotificationStatus.PENDING,
      };
      repo.createLog.mockResolvedValue(mockLog);

      const result = await service.send_email(
        'test@example.com',
        'Welcome',
        'Welcome message',
        { userId: 'user-1' },
      );

      expect(repo.createLog).toHaveBeenCalledWith({
        userId: 'user-1',
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        subject: 'Welcome',
        content: 'Welcome message',
        provider: 'bird',
        status: NotificationStatus.PENDING,
        metadata: null,
      });

      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-email',
        {
          logId: 'log-123',
          to: 'test@example.com',
          subject: 'Welcome',
          body: 'Welcome message',
          html: undefined,
          userId: 'user-1',
        },
        expect.objectContaining({
          jobId: 'email-log-123',
          attempts: 3,
        }),
      );

      expect(result).toEqual(mockLog);
    });
  });

  describe('send_sms / sendSms', () => {
    it('creates a NotificationLog and enqueues an SMS job in BullMQ', async () => {
      const mockLog = {
        id: 'log-456',
        channel: NotificationChannel.SMS,
        recipient: '+21612345678',
        content: 'Your code is 1234',
        status: NotificationStatus.PENDING,
      };
      repo.createLog.mockResolvedValue(mockLog);

      const result = await service.send_sms(
        '+21612345678',
        'Your code is 1234',
        { userId: 'user-2' },
      );

      expect(repo.createLog).toHaveBeenCalledWith({
        userId: 'user-2',
        channel: NotificationChannel.SMS,
        recipient: '+21612345678',
        subject: null,
        content: 'Your code is 1234',
        provider: 'bird',
        status: NotificationStatus.PENDING,
        metadata: null,
      });

      expect(smsQueue.add).toHaveBeenCalledWith(
        'send-sms',
        {
          logId: 'log-456',
          phone: '+21612345678',
          message: 'Your code is 1234',
          userId: 'user-2',
        },
        expect.objectContaining({
          jobId: 'sms-log-456',
          attempts: 3,
        }),
      );

      expect(result).toEqual(mockLog);
    });
  });

  describe('Domain Event Helpers', () => {
    it('sendWelcomeNotification dispatches email and SMS', async () => {
      repo.createLog.mockResolvedValue({ id: 'log-welcome' });

      await service.sendWelcomeNotification({
        id: 'user-1',
        email: 'john@example.com',
        phone: '+21612345678',
        name: 'John Doe',
      });

      expect(emailQueue.add).toHaveBeenCalled();
      expect(smsQueue.add).toHaveBeenCalled();
    });

    it('sendNewMessageNotification enqueues an email alert', async () => {
      repo.createLog.mockResolvedValue({ id: 'log-msg' });

      await service.sendNewMessageNotification(
        { id: 'user-rec', email: 'rec@example.com', name: 'Recipient' },
        'Sender Name',
        'conv-1',
        'Hello there!',
      );

      expect(emailQueue.add).toHaveBeenCalled();
    });

    it('sendPaymentConfirmationNotification sends payment details', async () => {
      repo.createLog.mockResolvedValue({ id: 'log-pay' });

      await service.sendPaymentConfirmationNotification(
        { id: 'user-pay', email: 'pay@example.com', name: 'Buyer' },
        { amount: 29.99, currency: 'USD', type: 'Abonnement' },
      );

      expect(emailQueue.add).toHaveBeenCalled();
    });

    it('sendMatchingSuggestionNotification alerts user', async () => {
      repo.createLog.mockResolvedValue({ id: 'log-match' });

      await service.sendMatchingSuggestionNotification(
        { id: 'user-m', email: 'match@example.com', name: 'Importer' },
        'Olive Oil Tunisia',
        'conv-123',
      );

      expect(emailQueue.add).toHaveBeenCalled();
    });

    it('sendFreeQuotaExceededNotification warns user', async () => {
      repo.createLog.mockResolvedValue({ id: 'log-quota' });

      await service.sendFreeQuotaExceededNotification({
        id: 'user-q',
        email: 'quota@example.com',
        name: 'Trader',
      });

      expect(emailQueue.add).toHaveBeenCalled();
    });

    it('sendCompanyValidationNotification notifies user on validation', async () => {
      repo.createLog.mockResolvedValue({ id: 'log-val' });

      await service.sendCompanyValidationNotification(
        { id: 'user-v', email: 'val@example.com', name: 'Owner' },
        'Acme Global',
        ValidationStatus.VALIDE,
      );

      expect(emailQueue.add).toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    it('retries a failed email notification', async () => {
      const failedLog = {
        id: 'log-failed-1',
        channel: NotificationChannel.EMAIL,
        recipient: 'fail@example.com',
        subject: 'Failed Subject',
        content: 'Failed Content',
        status: NotificationStatus.FAILED,
        userId: 'user-1',
      };
      repo.findById.mockResolvedValue(failedLog);
      repo.updateStatus.mockResolvedValue({
        ...failedLog,
        status: NotificationStatus.PENDING,
      });

      await service.retryNotification('log-failed-1');

      expect(repo.updateStatus).toHaveBeenCalledWith(
        'log-failed-1',
        NotificationStatus.PENDING,
        { errorMessage: null },
      );
      expect(emailQueue.add).toHaveBeenCalled();
    });

    it('throws error when trying to retry a non-failed notification', async () => {
      repo.findById.mockResolvedValue({
        id: 'log-sent-1',
        status: NotificationStatus.SENT,
      });

      await expect(service.retryNotification('log-sent-1')).rejects.toThrow(
        /Cannot retry notification/,
      );
    });
  });
});
