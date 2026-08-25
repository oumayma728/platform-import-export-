import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BirdClient } from '@messagebird/sdk';
import { EmailService } from './email.service';

jest.mock('@messagebird/sdk', () => ({
  BirdClient: jest.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;
  const send = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    (BirdClient as jest.Mock).mockImplementation(() => ({
      email: { send },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('bk_test_key') },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sends an email through Bird', async () => {
    const message = { id: 'message-id', status: 'accepted' };
    send.mockResolvedValue(message);
    const params = {
      from: { email: 'onboarding@messagebird.dev', name: 'Bird' },
      to: ['recipient@example.com'],
      subject: 'Hello World',
      html: '<p>Hello</p>',
    };

    await expect(service.send(params)).resolves.toEqual(message);
    expect(send).toHaveBeenCalledWith(params);
  });
});
