/*
  Warnings:

  - The values [pass] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[listing_id,exporter_company_id,importer_company_id]` on the table `conversations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `description` on table `companies` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'MEMBRE');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- DropIndex
DROP INDEX "conversations_exporter_company_id_idx";

-- DropIndex
DROP INDEX "conversations_importer_company_id_idx";

-- AlterTable
ALTER TABLE "companies" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'MEMBRE';

-- CreateIndex
CREATE INDEX "conversations_exporter_company_id_updated_at_idx" ON "conversations"("exporter_company_id", "updated_at");

-- CreateIndex
CREATE INDEX "conversations_importer_company_id_updated_at_idx" ON "conversations"("importer_company_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_listing_id_exporter_company_id_importer_compa_key" ON "conversations"("listing_id", "exporter_company_id", "importer_company_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
