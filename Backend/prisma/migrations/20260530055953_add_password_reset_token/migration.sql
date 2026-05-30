/*
  Warnings:

  - Made the column `pharmacy_id` on table `delivery_driver_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "delivery_driver_profiles" DROP CONSTRAINT "delivery_driver_profiles_pharmacy_id_fkey";

-- AlterTable
ALTER TABLE "delivery_driver_profiles" ALTER COLUMN "pharmacy_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "pharmacy_documents" (
    "id" TEXT NOT NULL,
    "pharmacy_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "document_url" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notification_preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_settings" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "base_consultation_fee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "default_permissions" TEXT[] DEFAULT ARRAY['view_health_data', 'buy_medicines', 'schedule_appointments']::TEXT[],
    "notification_prefs" JSONB NOT NULL DEFAULT '{}',
    "insurance_partners" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hours_of_operation" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_settings" (
    "id" TEXT NOT NULL,
    "pharmacy_id" TEXT NOT NULL,
    "default_vat_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "ticket_footer" TEXT DEFAULT '¡Gracias por su compra!',
    "invoice_series" TEXT NOT NULL DEFAULT 'A',
    "min_stock_alert_threshold" INTEGER NOT NULL DEFAULT 10,
    "expiration_alert_days" INTEGER NOT NULL DEFAULT 90,
    "delivery_fee_per_km" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "delivery_coverage_radius_km" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "default_cashier_role" TEXT NOT NULL DEFAULT 'cashier',
    "default_driver_role" TEXT NOT NULL DEFAULT 'delivery_driver',
    "notification_prefs" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pharmacy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pharmacy_documents_pharmacy_id_idx" ON "pharmacy_documents"("pharmacy_id");

-- CreateIndex
CREATE INDEX "pharmacy_documents_status_idx" ON "pharmacy_documents"("status");

-- CreateIndex
CREATE INDEX "pharmacy_documents_expiry_date_idx" ON "pharmacy_documents"("expiry_date");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_settings_clinic_id_key" ON "clinic_settings"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacy_settings_pharmacy_id_key" ON "pharmacy_settings"("pharmacy_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_email_idx" ON "password_reset_tokens"("email");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "delivery_driver_profiles_pharmacy_id_idx" ON "delivery_driver_profiles"("pharmacy_id");

-- CreateIndex
CREATE INDEX "inventory_movements_inventoryId_createdAt_idx" ON "inventory_movements"("inventoryId", "createdAt");

-- CreateIndex
CREATE INDEX "receptionist_profiles_clinic_id_idx" ON "receptionist_profiles"("clinic_id");

-- AddForeignKey
ALTER TABLE "delivery_driver_profiles" ADD CONSTRAINT "delivery_driver_profiles_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_documents" ADD CONSTRAINT "pharmacy_documents_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_documents" ADD CONSTRAINT "pharmacy_documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_documents" ADD CONSTRAINT "pharmacy_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_settings" ADD CONSTRAINT "clinic_settings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_settings" ADD CONSTRAINT "pharmacy_settings_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
