import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { NotificationsService } from './notifications.service';

describe('EmailService', () => {
  let service: EmailService;
  let notificationsService: { send_email: jest.Mock };

  beforeEach(async () => {
    notificationsService = { send_email: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('delegates send to notificationsService.send_email', async () => {
    notificationsService.send_email.mockResolvedValue({ id: 'log-1' });

    const result = await service.send('to@test.com', 'Subject', 'Body');

    expect(notificationsService.send_email).toHaveBeenCalledWith(
      'to@test.com',
      'Subject',
      'Body',
      undefined,
    );
    expect(result).toEqual({ id: 'log-1' });
  });
});
