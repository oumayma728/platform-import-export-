import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: {
    getNotificationLogs: jest.Mock;
    getNotificationLogById: jest.Mock;
    retryNotification: jest.Mock;
    retryAllFailed: jest.Mock;
    send_email: jest.Mock;
    send_sms: jest.Mock;
  };

  beforeEach(async () => {
    notificationsService = {
      getNotificationLogs: jest.fn(),
      getNotificationLogById: jest.fn(),
      retryNotification: jest.fn(),
      retryAllFailed: jest.fn(),
      send_email: jest.fn(),
      send_sms: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getLogs calls service.getNotificationLogs with query filters', async () => {
    notificationsService.getNotificationLogs.mockResolvedValue({
      items: [],
      total: 0,
    });

    const query = {
      channel: NotificationChannel.EMAIL,
      status: NotificationStatus.SENT,
      skip: 0,
      take: 10,
    };
    const result = await controller.getLogs(query);

    expect(notificationsService.getNotificationLogs).toHaveBeenCalledWith(
      query,
    );
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('getLogById retrieves a specific log', async () => {
    const mockLog = { id: 'log-123', status: NotificationStatus.SENT };
    notificationsService.getNotificationLogById.mockResolvedValue(mockLog);

    const result = await controller.getLogById('log-123');

    expect(notificationsService.getNotificationLogById).toHaveBeenCalledWith(
      'log-123',
    );
    expect(result).toEqual(mockLog);
  });

  it('retryLog re-enqueues a failed notification', async () => {
    const mockRetried = { id: 'log-123', status: NotificationStatus.PENDING };
    notificationsService.retryNotification.mockResolvedValue(mockRetried);

    const result = await controller.retryLog('log-123');

    expect(notificationsService.retryNotification).toHaveBeenCalledWith(
      'log-123',
    );
    expect(result).toEqual(mockRetried);
  });

  it('sendTestEmail sends test email for admin', async () => {
    notificationsService.send_email.mockResolvedValue({ id: 'test-log' });

    const result = await controller.sendTestEmail(
      {
        to: 'admin@example.com',
        subject: 'Test',
        body: 'Test content',
      },
      { id: 'admin-1' } as any,
    );

    expect(notificationsService.send_email).toHaveBeenCalledWith(
      'admin@example.com',
      'Test',
      'Test content',
      expect.objectContaining({
        userId: 'admin-1',
      }),
    );
    expect(result).toEqual({ id: 'test-log' });
  });

  it('sendTestSms sends test SMS for admin', async () => {
    notificationsService.send_sms.mockResolvedValue({ id: 'test-sms-log' });

    const result = await controller.sendTestSms(
      {
        phone: '+21612345678',
        message: 'Test SMS',
      },
      { id: 'admin-1' } as any,
    );

    expect(notificationsService.send_sms).toHaveBeenCalledWith(
      '+21612345678',
      'Test SMS',
      expect.objectContaining({
        userId: 'admin-1',
      }),
    );
    expect(result).toEqual({ id: 'test-sms-log' });
  });
});
