import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repo';
import { StripeService } from './stripe/stripe.service';
import { StripeWebhookService } from './stripe/stripe-webhook.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BillingStatus, SubscriptionStatus } from '@prisma/client';

describe('BillingService', () => {
  let service: BillingService;
  let billingRepo: jest.Mocked<BillingRepository>;
  let stripeService: jest.Mocked<StripeService>;
  let stripeWebhookService: jest.Mocked<StripeWebhookService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: BillingRepository,
          useValue: {
            findActiveSubscriptionPlanById: jest.fn(),
            findByUserId: jest.fn(),
            createBillingAccount: jest.fn(),
            updateSubscriptionStatus: jest.fn(),
          },
        },
        {
          provide: StripeService,
          useValue: {
            createCheckoutSession: jest.fn(),
            cancelSubscriptionAtPeriodEnd: jest.fn(),
          },
        },
        {
          provide: StripeWebhookService,
          useValue: {
            handleWebhookEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    billingRepo = module.get(BillingRepository);
    stripeService = module.get(StripeService);
    stripeWebhookService = module.get(StripeWebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSubscriptionPlanPrice', () => {
    it('should return plan when found', async () => {
      const mockPlan = { id: 'plan-1', name: 'Monthly', price: 29 } as any;
      billingRepo.findActiveSubscriptionPlanById.mockResolvedValue(mockPlan);

      const result = await service.getSubscriptionPlanPrice('plan-1');
      expect(result).toEqual(mockPlan);
    });

    it('should throw NotFoundException when plan is not found', async () => {
      billingRepo.findActiveSubscriptionPlanById.mockResolvedValue(null);

      await expect(service.getSubscriptionPlanPrice('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('startSubscriptionCheckout', () => {
    it('should return sessionId and checkoutUrl when plan and user are valid', async () => {
      const mockPlan = { id: 'plan-1', stripePriceId: 'price_123' } as any;
      const mockBillingAccount = { id: 'ba-1', userId: 'user-1', subscription: null, status: BillingStatus.GRATUIT } as any;
      const mockSession = { id: 'cs_123', url: 'https://checkout.stripe.com/pay/cs_123' } as any;

      billingRepo.findActiveSubscriptionPlanById.mockResolvedValue(mockPlan);
      billingRepo.findByUserId.mockResolvedValue(mockBillingAccount);
      stripeService.createCheckoutSession.mockResolvedValue(mockSession);

      const result = await service.startSubscriptionCheckout('user-1', 'plan-1');

      expect(result).toEqual({
        sessionId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
      });
      expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
        'user-1',
        'plan-1',
        'price_123',
        'ba-1',
      );
    });

    it('should prevent already-subscribed user from creating another checkout session', async () => {
      const mockPlan = { id: 'plan-1', stripePriceId: 'price_123' } as any;
      const activeAccount = {
        id: 'ba-1',
        userId: 'user-1',
        status: BillingStatus.ABONNE,
        subscription: { status: SubscriptionStatus.ACTIVE },
      } as any;

      billingRepo.findActiveSubscriptionPlanById.mockResolvedValue(mockPlan);
      billingRepo.findByUserId.mockResolvedValue(activeAccount);

      await expect(service.startSubscriptionCheckout('user-1', 'plan-1')).rejects.toThrow(
        'User already has an active subscription',
      );
      expect(stripeService.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('should create a billing account if none exists', async () => {
      const mockPlan = { id: 'plan-1', stripePriceId: 'price_123' } as any;
      const createdAccount = { id: 'ba-new', userId: 'user-1', subscription: null, status: BillingStatus.GRATUIT } as any;
      const mockSession = { id: 'cs_123', url: 'https://checkout.stripe.com/pay/cs_123' } as any;

      billingRepo.findActiveSubscriptionPlanById.mockResolvedValue(mockPlan);
      billingRepo.findByUserId.mockResolvedValue(null);
      billingRepo.createBillingAccount.mockResolvedValue(createdAccount);
      stripeService.createCheckoutSession.mockResolvedValue(mockSession);

      const result = await service.startSubscriptionCheckout('user-1', 'plan-1');

      expect(result).toEqual({
        sessionId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
      });
      expect(billingRepo.createBillingAccount).toHaveBeenCalledWith('user-1');
    });

    it('should throw BadRequestException if plan is not found', async () => {
      billingRepo.findActiveSubscriptionPlanById.mockResolvedValue(null);

      await expect(service.startSubscriptionCheckout('user-1', 'invalid-plan')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should schedule cancellation at period end and retain active access', async () => {
      const futureSeconds = Math.floor((Date.now() + 15 * 24 * 60 * 60 * 1000) / 1000);
      const futureDate = new Date(futureSeconds * 1000);
      const mockSub = {
        stripeSubscriptionId: 'sub_123',
        status: 'ACTIVE',
        currentPeriodEnd: futureDate,
      };
      const mockAccount = {
        id: 'ba-1',
        userId: 'user-1',
        subscription: mockSub,
      } as any;

      billingRepo.findByUserId.mockResolvedValue(mockAccount);
      stripeService.cancelSubscriptionAtPeriodEnd.mockResolvedValue({
        id: 'sub_123',
        items: {
          data: [{ current_period_end: futureSeconds }],
        },
      } as any);

      const result = await service.cancelSubscription('user-1');

      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.currentPeriodEnd).toEqual(futureDate);
      expect(stripeService.cancelSubscriptionAtPeriodEnd).toHaveBeenCalledWith('sub_123');
      expect(billingRepo.updateSubscriptionStatus).toHaveBeenCalledWith('sub_123', {
        status: 'ACTIVE',
        canceledAt: expect.any(Date),
        currentPeriodEnd: futureDate,
      });
    });

    it('should throw BadRequestException if no subscription exists for user', async () => {
      billingRepo.findByUserId.mockResolvedValue({ id: 'ba-1', userId: 'user-1', subscription: null } as any);

      await expect(service.cancelSubscription('user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
