/**
 * prisma/seed.ts
 *
 * Run via:  npx prisma db seed
 * (seed command is declared in prisma.config.ts → migrations.seed)
 *
 * NOTE: dotenv is NOT needed here — `prisma.config.ts` imports 'dotenv/config'
 * before this script runs, so all env vars are already available.
 */
import { PrismaClient, BillingInterval, UserRole, ValidationStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';



// ─── Client ─────────────────────────────────────────────────────────────────────
function createPrismaClient(): PrismaClient {
  const connectionString = new ConfigService().get<string>('DATABASE_URL');
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined. Check your .env file.');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const prisma = createPrismaClient();

// ─── Guard: fail fast if required env vars are missing ──────────────────────────
function requireEnv(key: string): string {
  const value = new ConfigService().get<string>(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

// ─── Seed data ───────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Monthly',
    interval: BillingInterval.MENSUEL,
    price: 29,
    currency: 'USD',
    envKey: 'STRIPE_MONTHLY_PRICE_ID',
  },
  {
    name: 'Yearly',
    interval: BillingInterval.ANNUEL,
    price: 290,
    currency: 'USD',
    envKey: 'STRIPE_YEARLY_PRICE_ID',
  },
] as const;

const ADMIN = {
  email: 'admin@platform.com',
  password: '12345678',
  name: 'Admin',
  phone: '+21300000000',
};

// ─── Seeders ─────────────────────────────────────────────────────────────────────
async function seedSubscriptionPlans(): Promise<void> {
  for (const plan of PLANS) {
    const stripePriceId = requireEnv(plan.envKey);

    await prisma.subscriptionPlan.upsert({
      where: { stripePriceId },
      update: {
        name: plan.name,
        interval: plan.interval,
        price: plan.price,
        currency: plan.currency,
        isActive: true,
      },
      create: {
        name: plan.name,
        interval: plan.interval,
        price: plan.price,
        currency: plan.currency,
        stripePriceId,
        isActive: true,
      },
    });

    console.log(`✔  Plan "${plan.name}" upserted (${stripePriceId})`);
  }
}

async function seedAdminUser(): Promise<void> {
  const passwordHash = await argon2.hash(ADMIN.password);

  await prisma.user.upsert({
    where: { email: ADMIN.email },
    update: {
      role: UserRole.ADMIN,
      status: ValidationStatus.VALIDE,
      passwordHash,
    },
    create: {
      email: ADMIN.email,
      name: ADMIN.name,
      phone: ADMIN.phone,
      passwordHash,
      role: UserRole.ADMIN,
      status: ValidationStatus.VALIDE,
      billingAccount: {
        create: {}, // inherits default GRATUIT status from schema
      },
    },
  });

  console.log(`✔  Admin user upserted (${ADMIN.email})`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('🌱 Starting seed...\n');
  await seedSubscriptionPlans();
  await seedAdminUser();
  console.log('\n✅ Seed completed successfully.');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());