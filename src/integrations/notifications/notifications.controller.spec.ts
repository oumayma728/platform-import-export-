import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';

jest.mock('@messagebird/sdk', () => ({
  BirdClient: jest.fn().mockImplementation(() => ({
    email: { send: jest.fn() },
  })),
}));

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('bk_test_key') },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
