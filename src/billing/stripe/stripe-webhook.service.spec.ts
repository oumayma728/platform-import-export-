import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeService } from './stripe.service';
import { BillingRepository } from '../billing.repo';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BillingStatus,
  SubscriptionStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';

describe('StripeWebhookService', () => {
  let service: StripeWebhookService;
  let stripeService: jest.Mocked<StripeService>;
  let billingRepo: jest.Mocked<BillingRepository>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        {
          provide: StripeService,
          useValue: {
            constructEventFromPayload: jest.fn(),
            getSubscription: jest.fn(),
          },
        },
        {
          provide: BillingRepository,
          useValue: {
            isWebhookEventProcessed: jest.fn(),
            recordWebhookEvent: jest.fn(),
            findBillingAccountById: jest.fn(),
            findBillingAccountByStripeCustomerId: jest.fn(),
            findByUserId: jest.fn(),
            setStripeCustomerIdByAccountId: jest.fn(),
            findSubscriptionPlanByStripePriceId: jest.fn(),
            findSubscriptionByStripeId: jest.fn(),
            upsertSubscription: jest.fn(),
            updateSubscriptionStatus: jest.fn(),
            updateBillingAccountStatusById: jest.fn(),
            findPaymentTransactionByStripeEventId: jest.fn(),
            createPaymentTransaction: jest.fn(),
            recordPaidConversation: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(async (cb) => cb({})),
          },
        },
      ],
    }).compile();

    service = module.get<StripeWebhookService>(StripeWebhookService);
    stripeService = module.get(StripeService);
    billingRepo = module.get(BillingRepository);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleWebhookEvent idempotency', () => {
    it('should return duplicate: true if event was already processed before transaction', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'invoice.paid',
        data: { object: {} },
      } as any;
      stripeService.constructEventFromPayload.mockReturnValue(mockEvent);
      billingRepo.isWebhookEventProcessed.mockResolvedValue(true);

      const result = await service.handleWebhookEvent(
        Buffer.from('{}'),
        'sig_123',
      );

      expect(result).toEqual({ received: true, duplicate: true });
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should return duplicate: true if recordWebhookEvent catches duplicate in transaction', async () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'invoice.paid',
        data: { object: {} },
      } as any;
      stripeService.constructEventFromPayload.mockReturnValue(mockEvent);
      billingRepo.isWebhookEventProcessed.mockResolvedValue(false);
      billingRepo.recordWebhookEvent.mockResolvedValue(false);

      const result = await service.handleWebhookEvent(
        Buffer.from('{}'),
        'sig_123',
      );

      expect(result).toEqual({ received: true, duplicate: true });
    });

    it('should throw and rollback if BillingAccount cannot be resolved so Stripe retries', async () => {
      const mockSession = {
        id: 'cs_123',
        mode: 'subscription',
        metadata: { billingAccountId: 'ba-unresolvable' },
      } as any;
      const mockEvent = {
        id: 'evt_unresolvable',
        type: 'checkout.session.completed',
        data: { object: mockSession },
      } as any;

      stripeService.constructEventFromPayload.mockReturnValue(mockEvent);
      billingRepo.isWebhookEventProcessed.mockResolvedValue(false);
      billingRepo.recordWebhookEvent.mockResolvedValue(true);
      billingRepo.findBillingAccountById.mockResolvedValue(null);
      billingRepo.findBillingAccountByStripeCustomerId.mockResolvedValue(null);
      billingRepo.findByUserId.mockResolvedValue(null);

      await expect(
        service.handleWebhookEvent(Buffer.from('{}'), 'sig_123'),
      ).rejects.toThrow(/BillingAccount could not be resolved/);
    });
  });

  describe('checkout.session.completed', () => {
    it('should link customer to BillingAccount but NOT create local subscription or set ABONNE prematurely', async () => {
      const mockSession = {
        id: 'cs_123',
        mode: 'subscription',
        payment_status: 'paid',
        customer: 'cus_123',
        subscription: 'sub_123',
        metadata: {
          billingAccountId: 'ba-123',
          planId: 'plan-monthly',
          userId: 'user-123',
        },
      } as any;
      const mockEvent = {
        id: 'evt_checkout',
        type: 'checkout.session.completed',
        data: { object: mockSession },
      } as any;

      stripeService.constructEventFromPayload.mockReturnValue(mockEvent);
      billingRepo.isWebhookEventProcessed.mockResolvedValue(false);
      billingRepo.recordWebhookEvent.mockResolvedValue(true);
      billingRepo.findBillingAccountById.mockResolvedValue({
        id: 'ba-123',
        userId: 'user-123',
        stripeCustomerId: null,
      } as any);

      const result = await service.handleWebhookEvent(
        Buffer.from('{}'),
        'sig_123',
      );

      expect(result).toEqual({ received: true });
      expect(billingRepo.findBillingAccountById).toHaveBeenCalledWith(
        'ba-123',
        expect.anything(),
      );
      expect(billingRepo.setStripeCustomerIdByAccountId).toHaveBeenCalledWith(
        'ba-123',
        'cus_123',
        expect.anything(),
      );
      // Local Subscription is NOT created in checkout.session.completed
      expect(billingRepo.upsertSubscription).not.toHaveBeenCalled();
      // BillingAccount is NOT marked as ABONNE in checkout.session.completed
      expect(billingRepo.updateBillingAccountStatusById).not.toHaveBeenCalled();
    });
  });

  describe('invoice.paid', () => {
    it('should authoritatively create local subscription, record transaction, and set ABONNE', async () => {
      const mockInvoice = {
        id: 'in_123',
        customer: 'cus_123',
        subscription: 'sub_123',
        amount_paid: 2900,
        lines: {
          data: [
            {
              price: { id: 'price_monthly' },
              period: { start: 1777408000, end: 1780000000 },
            },
          ],
        },
      } as any;
      const mockEvent = {
        id: 'evt_inv_paid',
        type: 'invoice.paid',
        data: { object: mockInvoice },
      } as any;

      stripeService.constructEventFromPayload.mockReturnValue(mockEvent);
      stripeService.getSubscription.mockResolvedValue({
        id: 'sub_123',
        items: {
          data: [
            {
              current_period_start: 1777408000,
              current_period_end: 1780000000,
            },
          ],
        },
      } as any);
      billingRepo.isWebhookEventProcessed.mockResolvedValue(false);
      billingRepo.recordWebhookEvent.mockResolvedValue(true);
      billingRepo.findSubscriptionByStripeId.mockResolvedValue(null);
      billingRepo.findBillingAccountByStripeCustomerId.mockResolvedValue({
        id: 'ba-123',
      } as any);
      billingRepo.findSubscriptionPlanByStripePriceId.mockResolvedValue({
        id: 'plan-monthly',
      } as any);
      billingRepo.findPaymentTransactionByStripeEventId.mockResolvedValue(null);

      const result = await service.handleWebhookEvent(
        Buffer.from('{}'),
        'sig_123',
      );

      expect(result).toEqual({ received: true });
      expect(billingRepo.createPaymentTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          billingAccountId: 'ba-123',
          stripeEventId: 'evt_inv_paid',
          stripeInvoiceId: 'in_123',
          idempotencyKey: 'invoice:in_123',
          type: TransactionType.ABONNEMENT,
          amount: 29,
          currency: 'USD',
          status: TransactionStatus.REUSSI,
        }),
        expect.anything(),
      );
      expect(billingRepo.upsertSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          billingAccountId: 'ba-123',
          planId: 'plan-monthly',
          stripeSubscriptionId: 'sub_123',
          status: SubscriptionStatus.ACTIF,
          currentPeriodStart: new Date(1777408000 * 1000),
          currentPeriodEnd: new Date(1780000000 * 1000),
        }),
        expect.anything(),
      );
      expect(billingRepo.updateBillingAccountStatusById).toHaveBeenCalledWith(
        'ba-123',
        BillingStatus.ABONNE,
        expect.anything(),
      );
    });
  });

  describe('invoice.payment_failed', () => {
    it('should record failed transaction and set SubscriptionStatus to PAST_DUE without immediate expiration', async () => {
      const mockInvoice = {
        id: 'in_fail_123',
        customer: 'cus_123',
        subscription: 'sub_123',
        amount_due: 2900,
      } as any;
      const mockEvent = {
        id: 'evt_inv_failed',
        type: 'invoice.payment_failed',
        data: { object: mockInvoice },
      } as any;

      stripeService.constructEventFromPayload.mockReturnValue(mockEvent);
      billingRepo.isWebhookEventProcessed.mockResolvedValue(false);
      billingRepo.recordWebhookEvent.mockResolvedValue(true);
      billingRepo.findSubscriptionByStripeId.mockResolvedValue({
        id: 'sub-db-1',
        billingAccountId: 'ba-123',
        billingAccount: { id: 'ba-123' },
      } as any);
      billingRepo.findPaymentTransactionByStripeEventId.mockResolvedValue(null);

      const result = await service.handleWebhookEvent(
        Buffer.from('{}'),
        'sig_123',
      );

      expect(result).toEqual({ received: true });
      expect(billingRepo.createPaymentTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          billingAccountId: 'ba-123',
          stripeEventId: 'evt_inv_failed',
          stripeInvoiceId: 'in_fail_123',
          idempotencyKey: 'invoice:in_fail_123',
          type: TransactionType.ABONNEMENT,
          amount: 29,
          currency: 'USD',
          status: TransactionStatus.ECHOUE,
        }),
        expect.anything(),
      );
      expect(billingRepo.updateSubscriptionStatus).toHaveBeenCalledWith(
        'sub_123',
        { status: SubscriptionStatus.IMPAYE },
        expect.anything(),
      );
      // Ensure BillingAccount was NOT demoted to ABONNEMENT_EXPIRE
      expect(
        billingRepo.updateBillingAccountStatusById,
      ).not.toHaveBeenCalledWith(
        'ba-123',
        BillingStatus.ABONNEMENT_EXPIRE,
        expect.anything(),
      );
    });
  });

  describe('payment_intent.succeeded', () => {
    it('should create paid conversation access only after a confirmed $2 payment', async () => {
      const paymentIntent = {
        id: 'pi_conversation_123',
        status: 'succeeded',
        amount_received: 200,
        currency: 'usd',
        customer: 'cus_123',
        metadata: {
          billingAccountId: 'ba-123',
          listingId: 'listing-123',
          exporterCompanyId: 'exporter-123',
          importerCompanyId: 'importer-123',
        },
      } as any;
      const event = {
        id: 'evt_payment_intent_succeeded',
        type: 'payment_intent.succeeded',
        data: { object: paymentIntent },
      } as any;

      stripeService.constructEventFromPayload.mockReturnValue(event);
      billingRepo.isWebhookEventProcessed.mockResolvedValue(false);
      billingRepo.recordWebhookEvent.mockResolvedValue(true);
      billingRepo.findBillingAccountById.mockResolvedValue({
        id: 'ba-123',
        stripeCustomerId: 'cus_123',
      } as any);

      await expect(
        service.handleWebhookEvent(Buffer.from('{}'), 'sig_123'),
      ).resolves.toEqual({ received: true });

      expect(billingRepo.recordPaidConversation).toHaveBeenCalledWith(
        {
          billingAccountId: 'ba-123',
          listingId: 'listing-123',
          exporterCompanyId: 'exporter-123',
          importerCompanyId: 'importer-123',
          stripePaymentIntentId: 'pi_conversation_123',
          stripeEventId: 'evt_payment_intent_succeeded',
          amount: 2,
          currency: 'usd',
        },
        expect.anything(),
      );
    });

    it('should not grant access from a non-conversation PaymentIntent', async () => {
      const event = {
        id: 'evt_unrelated_payment',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_unrelated',
            status: 'succeeded',
            amount_received: 200,
            currency: 'usd',
            metadata: {},
          },
        },
      } as any;

      stripeService.constructEventFromPayload.mockReturnValue(event);
      billingRepo.isWebhookEventProcessed.mockResolvedValue(false);
      billingRepo.recordWebhookEvent.mockResolvedValue(true);

      await service.handleWebhookEvent(Buffer.from('{}'), 'sig_123');

      expect(billingRepo.recordPaidConversation).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should mark subscription CANCELED and set BillingAccount to ABONNEMENT_EXPIRE', async () => {
      const mockSubscription = {
        id: 'sub_123',
        canceled_at: 1780000000,
      } as any;
      const mockEvent = {
        id: 'evt_sub_del',
        type: 'customer.subscription.deleted',
        data: { object: mockSubscription },
      } as any;

      stripeService.constructEventFromPayload.mockReturnValue(mockEvent);
      billingRepo.isWebhookEventProcessed.mockResolvedValue(false);
      billingRepo.recordWebhookEvent.mockResolvedValue(true);
      billingRepo.findSubscriptionByStripeId.mockResolvedValue({
        id: 'sub-db-1',
        billingAccountId: 'ba-123',
      } as any);

      const result = await service.handleWebhookEvent(
        Buffer.from('{}'),
        'sig_123',
      );

      expect(result).toEqual({ received: true });
      expect(billingRepo.updateSubscriptionStatus).toHaveBeenCalledWith(
        'sub_123',
        {
          status: SubscriptionStatus.ANNULE,
          canceledAt: expect.any(Date),
        },
        expect.anything(),
      );
      expect(billingRepo.updateBillingAccountStatusById).toHaveBeenCalledWith(
        'ba-123',
        BillingStatus.ABONNEMENT_EXPIRE,
        expect.anything(),
      );
    });
  });
});
