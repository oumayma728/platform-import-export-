-- CreateEnum
CREATE TYPE "ModerationEntityType" AS ENUM ('USER', 'COMPANY');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('VALIDATION', 'REJECTION', 'SUSPENSION', 'KYB_VERIFICATION', 'BADGE_ASSIGNED');

-- CreateTable
CREATE TABLE "moderation_history" (
    "id" TEXT NOT NULL,
    "entity_type" "ModerationEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action_type" "ModerationActionType" NOT NULL,
    "admin_id" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_history_pkey" PRIMARY KEY ("id")
);
