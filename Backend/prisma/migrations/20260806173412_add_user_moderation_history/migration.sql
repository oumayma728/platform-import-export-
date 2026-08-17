-- CreateTable
CREATE TABLE "user_moderation_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "motif" TEXT,
    "suspension_duration_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_moderation_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_moderation_history_user_id_idx" ON "user_moderation_history"("user_id");

-- CreateIndex
CREATE INDEX "user_moderation_history_admin_id_idx" ON "user_moderation_history"("admin_id");

-- AddForeignKey
ALTER TABLE "user_moderation_history" ADD CONSTRAINT "user_moderation_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_moderation_history" ADD CONSTRAINT "user_moderation_history_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
