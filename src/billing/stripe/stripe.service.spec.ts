import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../../users/users.repository';
import { BillingRepository } from '../billing.repo';

describe('StripeService', () => {
  let service: StripeService;
  let usersRepo: jest.Mocked<UsersRepository>;
  let billingRepo: jest.Mocked<BillingRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STRIPE_SECRET_KEY') return 'sk_test_mock';
              if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_mock';
              if (key === 'FRONTEND_URL') return 'http://localhost:3000';
              return null;
            }),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: BillingRepository,
          useValue: {
            findByUserId: jest.fn(),
            setStripeCustomerIdByUserId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    usersRepo = module.get(UsersRepository);
    billingRepo = module.get(BillingRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fail fast if STRIPE_SECRET_KEY is missing', () => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'STRIPE_SECRET_KEY') return null;
        return 'whsec_mock';
      }),
    } as any;

    expect(() => new StripeService(mockConfig, usersRepo, billingRepo)).toThrow(
      'STRIPE_SECRET_KEY is not defined',
    );
  });

  it('should fail fast if STRIPE_WEBHOOK_SECRET is missing', () => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'STRIPE_SECRET_KEY') return 'sk_test_mock';
        if (key === 'STRIPE_WEBHOOK_SECRET') return null;
        return null;
      }),
    } as any;

    expect(() => new StripeService(mockConfig, usersRepo, billingRepo)).toThrow(
      'STRIPE_WEBHOOK_SECRET is not defined',
    );
  });

  describe('getOrCreateCustomer', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    } as any;

    it('should return existing customer ID if customer exists in Stripe and is not deleted', async () => {
      usersRepo.findById.mockResolvedValue(mockUser);
      billingRepo.findByUserId.mockResolvedValue({
        id: 'ba-1',
        stripeCustomerId: 'cus_existing',
      } as any);

      const retrieveSpy = jest
        .spyOn((service as any).stripe.customers, 'retrieve')
        .mockResolvedValue({ id: 'cus_existing', deleted: false } as any);

      const result = await service.getOrCreateCustomer('user-1', 'ba-1');

      expect(result).toBe('cus_existing');
      expect(retrieveSpy).toHaveBeenCalledWith('cus_existing');
    });

    it('should recreate customer if Stripe indicates customer is deleted', async () => {
      usersRepo.findById.mockResolvedValue(mockUser);
      billingRepo.findByUserId.mockResolvedValue({
        id: 'ba-1',
        stripeCustomerId: 'cus_deleted',
      } as any);

      jest
        .spyOn((service as any).stripe.customers, 'retrieve')
        .mockResolvedValue({ id: 'cus_deleted', deleted: true } as any);

      const createSpy = jest
        .spyOn((service as any).stripe.customers, 'create')
        .mockResolvedValue({ id: 'cus_new' } as any);

      const result = await service.getOrCreateCustomer('user-1', 'ba-1');

      expect(result).toBe('cus_new');
      expect(createSpy).toHaveBeenCalled();
      expect(billingRepo.setStripeCustomerIdByUserId).toHaveBeenCalledWith(
        'user-1',
        'cus_new',
      );
    });

    it('should recreate customer if Stripe returns resource_missing', async () => {
      usersRepo.findById.mockResolvedValue(mockUser);
      billingRepo.findByUserId.mockResolvedValue({
        id: 'ba-1',
        stripeCustomerId: 'cus_missing',
      } as any);

      jest
        .spyOn((service as any).stripe.customers, 'retrieve')
        .mockRejectedValue({
          code: 'resource_missing',
          message: 'No such customer',
        } as any);

      const createSpy = jest
        .spyOn((service as any).stripe.customers, 'create')
        .mockResolvedValue({ id: 'cus_new' } as any);

      const result = await service.getOrCreateCustomer('user-1', 'ba-1');

      expect(result).toBe('cus_new');
      expect(createSpy).toHaveBeenCalled();
    });

    it('should propagate temporary Stripe/network errors without creating a new customer', async () => {
      usersRepo.findById.mockResolvedValue(mockUser);
      billingRepo.findByUserId.mockResolvedValue({
        id: 'ba-1',
        stripeCustomerId: 'cus_existing',
      } as any);

      const networkError = new Error('Connection timeout');
      jest
        .spyOn((service as any).stripe.customers, 'retrieve')
        .mockRejectedValue(networkError);

      const createSpy = jest.spyOn((service as any).stripe.customers, 'create');

      await expect(
        service.getOrCreateCustomer('user-1', 'ba-1'),
      ).rejects.toThrow('Connection timeout');
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('createConversationCheckoutSession', () => {
    it('should create a $2 payment Checkout session with PaymentIntent metadata', async () => {
      jest.spyOn(service, 'getOrCreateCustomer').mockResolvedValue('cus_123');
      const createSpy = jest
        .spyOn((service as any).stripe.checkout.sessions, 'create')
        .mockResolvedValue({
          id: 'cs_conversation_123',
          url: 'https://checkout.stripe.com/pay/cs_conversation_123',
        } as any);

      const input = {
        userId: 'user-1',
        billingAccountId: 'ba-1',
        listingId: 'listing-1',
        exporterCompanyId: 'exporter-1',
        importerCompanyId: 'importer-1',
      };

      const session = await service.createConversationCheckoutSession(input);

      expect(session.id).toBe('cs_conversation_123');
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          customer: 'cus_123',
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'usd',
                unit_amount: 200,
              }),
            }),
          ],
          metadata: {
            billingAccountId: 'ba-1',
            listingId: 'listing-1',
            exporterCompanyId: 'exporter-1',
            importerCompanyId: 'importer-1',
          },
          payment_intent_data: {
            metadata: {
              billingAccountId: 'ba-1',
              listingId: 'listing-1',
              exporterCompanyId: 'exporter-1',
              importerCompanyId: 'importer-1',
            },
          },
        }),
        expect.objectContaining({
          idempotencyKey:
            'conversation-checkout:ba-1:listing-1:exporter-1:importer-1',
        }),
      );
    });
  });
});
