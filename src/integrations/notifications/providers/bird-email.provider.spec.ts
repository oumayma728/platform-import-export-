import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BirdEmailProvider } from './bird-email.provider';
import { BirdClient } from '@messagebird/sdk';

jest.mock('@messagebird/sdk', () => ({
  BirdClient: jest.fn(),
}));

describe('BirdEmailProvider', () => {
  let provider: BirdEmailProvider;
  const mockSend = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    (BirdClient as jest.Mock).mockImplementation(() => ({
      email: { send: mockSend },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BirdEmailProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string, defaultVal?: string) => {
              if (key === 'EMAIL_SERVICE_API_KEY') return 'bk_eu1_test';
              return defaultVal;
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<BirdEmailProvider>(BirdEmailProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('successfully sends email via BirdClient', async () => {
    mockSend.mockResolvedValue({ id: 'bird-msg-1', status: 'accepted' });

    const result = await provider.sendEmail({
      to: 'recipient@example.com',
      subject: 'Hello',
      body: 'World',
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ['recipient@example.com'],
        subject: 'Hello',
      }),
    );
    expect(result).toEqual({
      messageId: 'bird-msg-1',
      status: 'accepted',
      raw: { id: 'bird-msg-1', status: 'accepted' },
    });
  });

  it('propagates error when BirdClient fails', async () => {
    mockSend.mockRejectedValue(new Error('Bird API error'));

    await expect(
      provider.sendEmail({
        to: 'recipient@example.com',
        subject: 'Hello',
        body: 'World',
      }),
    ).rejects.toThrow('Bird API error');
  });
});
