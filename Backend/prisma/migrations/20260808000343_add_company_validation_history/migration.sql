-- CreateTable
CREATE TABLE "company_validation_history" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "status" "ValidationStatus" NOT NULL,
    "motif" TEXT,
    "validated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_validation_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_validation_history_company_id_idx" ON "company_validation_history"("company_id");

-- CreateIndex
CREATE INDEX "company_validation_history_admin_id_idx" ON "company_validation_history"("admin_id");

-- AddForeignKey
ALTER TABLE "company_validation_history" ADD CONSTRAINT "company_validation_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_validation_history" ADD CONSTRAINT "company_validation_history_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
