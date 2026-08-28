import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';
import { NotificationsService } from './notifications.service';

describe('SmsService', () => {
  let service: SmsService;
  let notificationsService: { send_sms: jest.Mock };

  beforeEach(async () => {
    notificationsService = { send_sms: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('delegates send to notificationsService.send_sms', async () => {
    notificationsService.send_sms.mockResolvedValue({ id: 'log-sms-1' });

    const result = await service.send('+21612345678', 'Test SMS');

    expect(notificationsService.send_sms).toHaveBeenCalledWith(
      '+21612345678',
      'Test SMS',
      undefined,
    );
    expect(result).toEqual({ id: 'log-sms-1' });
  });
});
