import { Test, TestingModule } from '@nestjs/testing';
import { SmsProcessor } from './sms.processor';
import { SMS_PROVIDER } from '../constants/notification.constants';
import { NotificationsRepository } from '../notifications.repository';
import { NotificationStatus } from '@prisma/client';
import type { Job } from 'bullmq';

describe('SmsProcessor', () => {
  let processor: SmsProcessor;
  let smsProvider: { sendSms: jest.Mock };
  let repo: { updateStatus: jest.Mock; incrementAttempt: jest.Mock };

  beforeEach(async () => {
    smsProvider = { sendSms: jest.fn() };
    repo = { updateStatus: jest.fn(), incrementAttempt: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsProcessor,
        { provide: SMS_PROVIDER, useValue: smsProvider },
        { provide: NotificationsRepository, useValue: repo },
      ],
    }).compile();

    processor = module.get<SmsProcessor>(SmsProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('processes SMS job successfully and updates log status to SENT', async () => {
    const job = {
      id: 'job-s1',
      data: {
        logId: 'log-s1',
        phone: '+21612345678',
        message: 'Hello SMS',
      },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job;

    smsProvider.sendSms.mockResolvedValue({
      messageId: 'sms-msg-1',
      status: 'sent',
    });

    const result = await processor.process(job as any);

    expect(smsProvider.sendSms).toHaveBeenCalledWith({
      to: '+21612345678',
      message: 'Hello SMS',
    });
    expect(repo.updateStatus).toHaveBeenCalledWith(
      'log-s1',
      NotificationStatus.SENT,
      expect.objectContaining({
        attempts: 1,
        errorMessage: null,
      }),
    );
    expect(result).toEqual({ messageId: 'sms-msg-1', status: 'sent' });
  });

  it('records attempt and rethrows on failure', async () => {
    const job = {
      id: 'job-s2',
      data: {
        logId: 'log-s2',
        phone: '+21612345678',
        message: 'SMS error test',
      },
      attemptsMade: 2,
      opts: { attempts: 3 },
    } as unknown as Job;

    smsProvider.sendSms.mockRejectedValue(new Error('Gateway timeout'));

    await expect(processor.process(job as any)).rejects.toThrow(
      'Gateway timeout',
    );
    expect(repo.incrementAttempt).toHaveBeenCalledWith('log-s2', {
      errorMessage: 'Gateway timeout',
      isFinalFailure: true,
    });
  });
});
