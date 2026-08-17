-- CreateEnum
CREATE TYPE "KybStatus" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE');

-- CreateTable
CREATE TABLE "kyb_verification" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "status" "KybStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "checklist_items" JSONB NOT NULL,
    "kyb_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMP(3),

    CONSTRAINT "kyb_verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kyb_verification_company_id_key" ON "kyb_verification"("company_id");

-- AddForeignKey
ALTER TABLE "kyb_verification" ADD CONSTRAINT "kyb_verification_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
