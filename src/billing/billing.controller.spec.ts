import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BadRequestException } from '@nestjs/common';

describe('BillingController', () => {
  let controller: BillingController;
  let billingService: jest.Mocked<BillingService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        {
          provide: BillingService,
          useValue: {
            startSubscriptionCheckout: jest.fn(),
            handleStripeWebhook: jest.fn(),
            cancelSubscription: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    billingService = module.get(BillingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    it('should call billingService.startSubscriptionCheckout', async () => {
      const mockResponse = { sessionId: 'cs_123', checkoutUrl: 'https://checkout.stripe.com/pay/cs_123' };
      billingService.startSubscriptionCheckout.mockResolvedValue(mockResponse);

      const result = await controller.createCheckoutSession({ id: 'user-1' } as any, 'plan-1');
      expect(result).toEqual(mockResponse);
      expect(billingService.startSubscriptionCheckout).toHaveBeenCalledWith('user-1', 'plan-1');
    });
  });

  describe('handleStripeWebhook', () => {
    it('should throw BadRequestException if rawBody is missing', async () => {
      const req = {} as any;
      await expect(controller.handleStripeWebhook(req, 'sig_123')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if signature is missing', async () => {
      const req = { rawBody: Buffer.from('{}') } as any;
      await expect(controller.handleStripeWebhook(req, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call billingService.handleStripeWebhook with valid body and signature', async () => {
      const req = { rawBody: Buffer.from('{"id":"evt_123"}') } as any;
      billingService.handleStripeWebhook.mockResolvedValue({ received: true });

      const result = await controller.handleStripeWebhook(req, 'sig_valid');
      expect(result).toEqual({ received: true });
      expect(billingService.handleStripeWebhook).toHaveBeenCalledWith(req.rawBody, 'sig_valid');
    });
  });

  describe('cancelSubscription', () => {
    it('should call billingService.cancelSubscription', async () => {
      const mockResponse = {
        message: 'Subscription cancellation scheduled at the end of the billing period.',
        cancelAtPeriodEnd: true,
        currentPeriodEnd: new Date(),
      };
      billingService.cancelSubscription.mockResolvedValue(mockResponse);

      const result = await controller.cancelSubscription({ id: 'user-1' } as any);
      expect(result).toEqual(mockResponse);
      expect(billingService.cancelSubscription).toHaveBeenCalledWith('user-1');
    });
  });
});
