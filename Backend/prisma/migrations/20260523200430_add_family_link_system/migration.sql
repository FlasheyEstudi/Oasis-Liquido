-- AlterTable
ALTER TABLE "family_relationships" ADD COLUMN     "code_expires_at" TIMESTAMP(3),
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY['view_health_data', 'buy_medicines', 'schedule_appointments']::TEXT[],
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "verification_code" TEXT;

-- CreateIndex
CREATE INDEX "family_relationships_verification_code_idx" ON "family_relationships"("verification_code");
