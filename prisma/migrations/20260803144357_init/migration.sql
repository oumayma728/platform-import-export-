-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBRE');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('EN_ATTENTE_VALIDATION', 'VALIDE', 'REJETE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('OFFRE', 'DEMANDE');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIF', 'SUSPENDUE', 'CLOTUREE');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('SUGGEREE', 'CONSULTEE', 'EN_CONTACT', 'EN_NEGOCIATION', 'CONCLUE', 'REJETEE');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('GRATUIT', 'LIMITE_ATTEINTE', 'PAIEMENT_USAGE', 'ABONNE', 'ABONNEMENT_EXPIRE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAIEMENT_USAGE', 'ABONNEMENT', 'REMBOURSEMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('REUSSI', 'ECHOUE', 'EN_ATTENTE');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MENSUEL', 'ANNUEL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIF', 'ANNULE', 'IMPAYE', 'EXPIRE');

-- CreateEnum
CREATE TYPE "ConversationAccessSource" AS ENUM ('GRATUIT', 'PAIEMENT_A_L_USAGE', 'ABONNEMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "ValidationStatus" NOT NULL DEFAULT 'EN_ATTENTE_VALIDATION',
    "role" "UserRole" NOT NULL DEFAULT 'MEMBRE',
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_exporter" BOOLEAN NOT NULL DEFAULT false,
    "is_importer" BOOLEAN NOT NULL DEFAULT false,
    "country" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "website" TEXT,
    "logo_url" TEXT,
    "registration_number" TEXT,
    "certification_docs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "type" "ListingType" NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "price_usd" DECIMAL(12,2),
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "incoterm" TEXT NOT NULL,
    "deadline" DATE,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_documents" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "exporter_company_id" TEXT NOT NULL,
    "importer_company_id" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'SUGGEREE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachment_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "free_chats_used" INTEGER NOT NULL DEFAULT 0,
    "billing_status" "BillingStatus" NOT NULL DEFAULT 'GRATUIT',
    "stripe_customer_id" TEXT,
    "cumulative_usage_spend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "billing_account_id" TEXT NOT NULL,
    "stripe_event_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "stripe_price_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "billing_account_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "stripe_subscription_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIF',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_accesses" (
    "id" TEXT NOT NULL,
    "billing_account_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "source" "ConversationAccessSource" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_webhook_events" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "listings_company_id_idx" ON "listings"("company_id");

-- CreateIndex
CREATE INDEX "listings_category_idx" ON "listings"("category");

-- CreateIndex
CREATE INDEX "listings_country_idx" ON "listings"("country");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listing_documents_listing_id_idx" ON "listing_documents"("listing_id");

-- CreateIndex
CREATE INDEX "conversations_listing_id_idx" ON "conversations"("listing_id");

-- CreateIndex
CREATE INDEX "conversations_exporter_company_id_updated_at_idx" ON "conversations"("exporter_company_id", "updated_at");

-- CreateIndex
CREATE INDEX "conversations_importer_company_id_updated_at_idx" ON "conversations"("importer_company_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_listing_id_exporter_company_id_importer_compa_key" ON "conversations"("listing_id", "exporter_company_id", "importer_company_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_user_id_key" ON "billing_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_stripe_event_id_key" ON "payment_transactions"("stripe_event_id");

-- CreateIndex
CREATE INDEX "payment_transactions_billing_account_id_idx" ON "payment_transactions"("billing_account_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripe_price_id_key" ON "subscription_plans"("stripe_price_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_billing_account_id_key" ON "subscriptions"("billing_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_accesses_billing_account_id_conversation_id_key" ON "conversation_accesses"("billing_account_id", "conversation_id");

-- CreateIndex
CREATE INDEX "conversation_accesses_conversation_id_idx" ON "conversation_accesses"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "processed_webhook_events_event_id_key" ON "processed_webhook_events"("event_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_documents" ADD CONSTRAINT "listing_documents_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_exporter_company_id_fkey" FOREIGN KEY ("exporter_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_importer_company_id_fkey" FOREIGN KEY ("importer_company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_accounts" ADD CONSTRAINT "billing_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_accesses" ADD CONSTRAINT "conversation_accesses_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_accesses" ADD CONSTRAINT "conversation_accesses_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
