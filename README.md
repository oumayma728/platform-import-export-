# Import/Export API

NestJS backend for an import/export marketplace. It provides authentication, companies, listings, recommendations, messaging, billing, file storage, and external integrations.

## Requirements

- Node.js 20+, npm, PostgreSQL, and Redis
- Stripe account and CLI for billing webhooks
- Supabase project for listing document storage

Logistics, currency, email, and SMS providers are only required for their respective features.

## Setup

```bash
npm install
Copy-Item .env.example .env       # Windows
# cp .env.example .env            # macOS/Linux
npx prisma generate
npx prisma migrate dev
npx prisma db seed                # optional development data
npm run start:dev
```

Before starting, ensure PostgreSQL and Redis are running. Set at least these values in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/import_export"
JWT_ACCESS_SECRET=replace-me
JWT_REFRESH_SECRET=replace-me
REDIS_HOST=localhost
REDIS_PORT=6379
```

The API runs at `http://localhost:3000` by default. Set `PORT` to change it.

## Environment

Use `.env.example` as the full reference. Important variables include:

- `DATABASE_URL`: PostgreSQL connection for Prisma
- `JWT_*`: access and refresh token settings
- `SEED_ADMIN_*`: credentials for the seeded admin
- `FRONTEND_URL`: frontend origin for checkout redirects
- `STRIPE_*`: checkout, subscriptions, prices, and webhooks
- `SUPABASE_URL`, `SUPABASE_KEY`: Supabase Storage
- `REDIS_*`: currency cache connection
- `OPEN_ROUTE_SERVICE_API_KEY`: logistics integration
- `CURRENCY_CONVERTER_API_KEY`: currency conversion
- `EMAIL_*`, `SMS_*`: notification providers

Never commit `.env` or real credentials.

## Stripe webhooks

Stripe confirms payment through webhooks; browser redirects do not update billing state. With the API running, forward local events with:

```bash
stripe listen --forward-to localhost:3000/billing/webhooks/stripe
```

Set the printed signing secret as `STRIPE_WEBHOOK_SECRET`. Subscription checkout requests require a new `Idempotency-Key` UUID for each payment attempt.

## API and Prisma

Swagger UI: `http://localhost:3000/api`. Protected endpoints require a bearer access token.

```bash
npx prisma migrate deploy  # apply migrations in deployment
npx prisma studio          # inspect the database
```

## NPM scripts

```bash
npm run start:dev   # development with watch mode
npm run build       # compile the application
npm run start:prod  # run the compiled application
npm run test        # unit tests
npm run test:e2e    # end-to-end tests
npm run test:cov    # coverage report
npm run lint        # lint and autofix
npm run format      # format source files
```

## Project layout

| Directory | Responsibility |
| --- | --- |
| `src/auth`, `src/users` | Authentication and users |
| `src/companies`, `src/listings` | Marketplace data |
| `src/messaging` | REST messaging and Socket.IO |
| `src/billing` | Billing, Stripe checkout, and webhooks |
| `src/integrations`, `src/supabase` | External service adapters |
| `prisma` | Schema, migrations, and seed |
| `test` | End-to-end test configuration |
