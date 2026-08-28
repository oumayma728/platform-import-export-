import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BirdSmsProvider } from './bird-sms.provider';
import { BirdClient } from '@messagebird/sdk';

jest.mock('@messagebird/sdk', () => ({
  BirdClient: jest.fn(),
}));

describe('BirdSmsProvider', () => {
  let provider: BirdSmsProvider;
  const mockSmsSend = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    (BirdClient as jest.Mock).mockImplementation(() => ({
      sms: { send: mockSmsSend },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BirdSmsProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultVal?: string) => {
              if (key === 'SMS_SERVICE_API_KEY') return 'bk_eu1_sms_key';
              return defaultVal;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<BirdSmsProvider>(BirdSmsProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('successfully sends SMS via BirdClient', async () => {
    mockSmsSend.mockResolvedValue({ id: 'bird-sms-1', status: 'sent' });

    const result = await provider.sendSms({
      to: '+21612345678',
      message: 'Hello from SMS',
    });

    expect(mockSmsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '+21612345678',
        text: 'Hello from SMS',
      }),
    );
    expect(result).toEqual({
      messageId: 'bird-sms-1',
      status: 'sent',
      raw: { id: 'bird-sms-1', status: 'sent' },
    });
  });

  it('propagates error when SMS fails', async () => {
    mockSmsSend.mockRejectedValue(new Error('SMS Gateway unreachable'));

    await expect(
      provider.sendSms({
        to: '+21612345678',
        message: 'Hello',
      }),
    ).rejects.toThrow('SMS Gateway unreachable');
  });
});
