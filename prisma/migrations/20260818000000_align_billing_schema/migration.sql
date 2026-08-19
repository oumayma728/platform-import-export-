-- Align the deployed database with the current Prisma schema without
-- rewriting the already-applied initial migration.

-- AlterTable
ALTER TABLE "companies"
ADD COLUMN "validation_status" "ValidationStatus" NOT NULL DEFAULT 'EN_ATTENTE_VALIDATION';

-- AlterTable
ALTER TABLE "payment_transactions"
ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
ADD COLUMN "idempotency_key" TEXT,
ADD COLUMN "stripe_invoice_id" TEXT,
ADD COLUMN "stripe_payment_intent_id" TEXT,
ALTER COLUMN "stripe_event_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_stripe_customer_id_key"
ON "billing_accounts"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "billing_accounts_stripe_customer_id_idx"
ON "billing_accounts"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_stripe_payment_intent_id_key"
ON "payment_transactions"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_stripe_invoice_id_key"
ON "payment_transactions"("stripe_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_idempotency_key_key"
ON "payment_transactions"("idempotency_key");

-- UpdateForeignKey
ALTER TABLE "payment_transactions"
DROP CONSTRAINT "payment_transactions_billing_account_id_fkey";

ALTER TABLE "payment_transactions"
ADD CONSTRAINT "payment_transactions_billing_account_id_fkey"
FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
