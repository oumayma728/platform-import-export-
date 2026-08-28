import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from './email.processor';
import { EMAIL_PROVIDER } from '../constants/notification.constants';
import { NotificationsRepository } from '../notifications.repository';
import { NotificationStatus } from '@prisma/client';
import type { Job } from 'bullmq';

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let emailProvider: { sendEmail: jest.Mock };
  let repo: { updateStatus: jest.Mock; incrementAttempt: jest.Mock };

  beforeEach(async () => {
    emailProvider = { sendEmail: jest.fn() };
    repo = { updateStatus: jest.fn(), incrementAttempt: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: EMAIL_PROVIDER, useValue: emailProvider },
        { provide: NotificationsRepository, useValue: repo },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('processes email job successfully and updates log status to SENT', async () => {
    const job = {
      id: 'job-1',
      data: {
        logId: 'log-1',
        to: 'user@example.com',
        subject: 'Subj',
        body: 'Body text',
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job;

    emailProvider.sendEmail.mockResolvedValue({
      messageId: 'msg-1',
      status: 'accepted',
    });

    const result = await processor.process(job as any);

    expect(emailProvider.sendEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Subj',
      body: 'Body text',
      html: undefined,
    });
    expect(repo.updateStatus).toHaveBeenCalledWith(
      'log-1',
      NotificationStatus.SENT,
      expect.objectContaining({
        attempts: 1,
        errorMessage: null,
      }),
    );
    expect(result).toEqual({ messageId: 'msg-1', status: 'accepted' });
  });

  it('handles delivery failure, records attempt, and rethrows for retry', async () => {
    const job = {
      id: 'job-2',
      data: {
        logId: 'log-2',
        to: 'user@example.com',
        subject: 'Subj',
        body: 'Body',
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job;

    emailProvider.sendEmail.mockRejectedValue(new Error('Network error'));

    await expect(processor.process(job as any)).rejects.toThrow(
      'Network error',
    );
    expect(repo.incrementAttempt).toHaveBeenCalledWith('log-2', {
      errorMessage: 'Network error',
      isFinalFailure: false,
    });
  });
});
