import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repo';
import { StripeService } from './stripe/stripe.service';
import { StripeWebhookService } from './stripe/stripe-webhook.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  BillingInterval,
  BillingStatus,
  SubscriptionStatus,
} from '@prisma/client';

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
            findActiveSubscriptionPlanByInterval: jest.fn(),
            findByUserId: jest.fn(),
            createBillingAccount: jest.fn(),
            ensureBillingAccount: jest.fn(),
            updateSubscriptionStatus: jest.fn(),
            updateBillingAccountStatusById: jest.fn(),
          },
        },
        {
          provide: StripeService,
          useValue: {
            createCheckoutSession: jest.fn(),
            createConversationCheckoutSession: jest.fn(),
            cancelSubscriptionAtPeriodEnd: jest.fn(),
            cancelSubscriptionImmediately: jest.fn(),
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

      await expect(
        service.getSubscriptionPlanPrice('invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('startSubscriptionCheckout', () => {
    it('should return sessionId and checkoutUrl when plan and user are valid', async () => {
      const mockPlan = { id: 'plan-1', stripePriceId: 'price_123' } as any;
      const mockBillingAccount = {
        id: 'ba-1',
        userId: 'user-1',
        subscription: null,
        billingStatus: BillingStatus.GRATUIT,
      } as any;
      const mockSession = {
        id: 'cs_123',
        url: 'https://checkout.stripe.com/pay/cs_123',
      } as any;

      billingRepo.findActiveSubscriptionPlanById.mockResolvedValue(mockPlan);
      billingRepo.ensureBillingAccount.mockResolvedValue(mockBillingAccount);
      stripeService.createCheckoutSession.mockResolvedValue(mockSession);

      const result = await service.startSubscriptionCheckout(
        'user-1',
        'plan-1',
        'checkout-attempt-1',
      );

      expect(result).toEqual({
        sessionId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
      });
      expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
        'user-1',
        'plan-1',
        'price_123',
        'ba-1',
        'checkout-attempt-1',
      );
    });

    it('should prevent already-subscribed user from creating another checkout session', async () => {
      const mockPlan = { id: 'plan-1', stripePriceId: 'price_123' } as any;
      const activeAccount = {
        id: 'ba-1',
        userId: 'user-1',
        billingStatus: BillingStatus.ABONNE,
        subscription: { status: SubscriptionStatus.ACTIF },
      } as any;

      billingRepo.findActiveSubscriptionPlanById.mockResolvedValue(mockPlan);
      billingRepo.ensureBillingAccount.mockResolvedValue(activeAccount);

      await expect(
        service.startSubscriptionCheckout(
          'user-1',
          'plan-1',
          'checkout-attempt-1',
        ),
      ).rejects.toThrow('User already has an active subscription');
      expect(stripeService.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('should ensure a billing account before creating checkout', async () => {
      const mockPlan = { id: 'plan-1', stripePriceId: 'price_123' } as any;
      const createdAccount = {
        id: 'ba-new',
        userId: 'user-1',
        subscription: null,
        billingStatus: BillingStatus.GRATUIT,
      } as any;
      const mockSession = {
        id: 'cs_123',
        url: 'https://checkout.stripe.com/pay/cs_123',
      } as any;

      billingRepo.findActiveSubscriptionPlanById.mockResolvedValue(mockPlan);
      billingRepo.ensureBillingAccount.mockResolvedValue(createdAccount);
      stripeService.createCheckoutSession.mockResolvedValue(mockSession);

      const result = await service.startSubscriptionCheckout(
        'user-1',
        'plan-1',
        'checkout-attempt-1',
      );

      expect(result).toEqual({
        sessionId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
      });
      expect(billingRepo.ensureBillingAccount).toHaveBeenCalledWith('user-1');
    });

    it('should throw BadRequestException if plan is not found', async () => {
      billingRepo.findActiveSubscriptionPlanById.mockResolvedValue(null);

      await expect(
        service.startSubscriptionCheckout(
          'user-1',
          'invalid-plan',
          'checkout-attempt-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBillingRecommendation', () => {
    const monthlyPlan = {
      interval: BillingInterval.MENSUEL,
      price: 29,
      currency: 'USD',
    } as any;

    beforeEach(() => {
      billingRepo.findActiveSubscriptionPlanByInterval.mockResolvedValue(
        monthlyPlan,
      );
    });

    it('does not recommend a subscription below the monthly price', async () => {
      billingRepo.findByUserId.mockResolvedValue({
        cumulativeUsageSpend: 28,
      } as any);

      await expect(
        service.getBillingRecommendation('user-1'),
      ).resolves.toMatchObject({
        recommended: false,
        cumulativePaygSpending: 28,
        subscriptionPrice: 29,
      });
    });

    it('does not recommend at exactly the monthly price', async () => {
      billingRepo.findByUserId.mockResolvedValue({
        cumulativeUsageSpend: 29,
      } as any);

      await expect(
        service.getBillingRecommendation('user-1'),
      ).resolves.toMatchObject({ recommended: false });
    });

    it('recommends a subscription above the monthly price', async () => {
      billingRepo.findByUserId.mockResolvedValue({
        cumulativeUsageSpend: 30,
      } as any);

      await expect(
        service.getBillingRecommendation('user-1'),
      ).resolves.toMatchObject({
        recommended: true,
        cumulativePaygSpending: 30,
        subscriptionPrice: 29,
      });
    });

    it('compares against the annual price when requested', async () => {
      billingRepo.findActiveSubscriptionPlanByInterval.mockResolvedValue({
        interval: BillingInterval.ANNUEL,
        price: 290,
        currency: 'USD',
      } as any);
      billingRepo.findByUserId.mockResolvedValue({
        cumulativeUsageSpend: 291,
      } as any);

      await expect(
        service.getBillingRecommendation('user-1', BillingInterval.ANNUEL),
      ).resolves.toEqual({
        recommended: true,
        cumulativePaygSpending: 291,
        subscriptionPrice: 290,
        subscriptionInterval: BillingInterval.ANNUEL,
        currency: 'USD',
      });
    });
  });

  describe('startConversationCheckout', () => {
    it('should return a one-time Checkout session for a paid conversation', async () => {
      const input = {
        userId: 'user-1',
        billingAccountId: 'ba-1',
        listingId: 'listing-1',
        exporterCompanyId: 'exporter-1',
        importerCompanyId: 'importer-1',
      };
      stripeService.createConversationCheckoutSession.mockResolvedValue({
        id: 'cs_conversation_123',
        url: 'https://checkout.stripe.com/pay/cs_conversation_123',
      } as any);

      await expect(service.startConversationCheckout(input)).resolves.toEqual({
        sessionId: 'cs_conversation_123',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_conversation_123',
      });
      expect(
        stripeService.createConversationCheckoutSession,
      ).toHaveBeenCalledWith(input);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately and update status in DB', async () => {
      const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
      const mockSub = {
        stripeSubscriptionId: 'sub_123',
        status: SubscriptionStatus.ACTIF,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: futureDate,
      };
      const mockAccount = {
        id: 'ba-1',
        userId: 'user-1',
        subscription: mockSub,
      } as any;

      billingRepo.findByUserId.mockResolvedValue(mockAccount);
      stripeService.cancelSubscriptionImmediately.mockResolvedValue({
        id: 'sub_123',
        status: 'canceled',
      } as any);

      const result = await service.cancelSubscription('user-1');

      expect(result.message).toBe('Subscription canceled successfully.');
      expect(result.cancelAtPeriodEnd).toBe(false);
      expect(stripeService.cancelSubscriptionImmediately).toHaveBeenCalledWith(
        'sub_123',
      );
      expect(billingRepo.updateSubscriptionStatus).toHaveBeenCalledWith(
        'sub_123',
        {
          status: SubscriptionStatus.ANNULE,
          canceledAt: expect.any(Date),
          cancelAtPeriodEnd: false,
        },
      );
      expect(
        billingRepo.updateBillingAccountStatusById,
      ).toHaveBeenCalledWith('ba-1', BillingStatus.ABONNEMENT_EXPIRE);
    });

    it('should return immediately without extra DB queries if already canceled', async () => {
      const mockSub = {
        stripeSubscriptionId: 'sub_123',
        status: SubscriptionStatus.ANNULE,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(),
      };
      const mockAccount = {
        id: 'ba-1',
        userId: 'user-1',
        subscription: mockSub,
      } as any;

      billingRepo.findByUserId.mockResolvedValue(mockAccount);

      const result = await service.cancelSubscription('user-1');

      expect(result.message).toBe('Subscription is already canceled.');
      expect(stripeService.cancelSubscriptionImmediately).not.toHaveBeenCalled();
      expect(billingRepo.updateSubscriptionStatus).not.toHaveBeenCalled();
      expect(
        billingRepo.updateBillingAccountStatusById,
      ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if no subscription exists for user', async () => {
      billingRepo.findByUserId.mockResolvedValue({
        id: 'ba-1',
        userId: 'user-1',
        subscription: null,
      } as any);

      await expect(service.cancelSubscription('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
