/*
  Warnings:

  - Made the column `clinic_id` on table `doctor_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "doctor_profiles" DROP CONSTRAINT "doctor_profiles_clinic_id_fkey";

-- AlterTable
ALTER TABLE "clinics" ADD COLUMN     "owner_id" TEXT;

-- AlterTable
ALTER TABLE "delivery_driver_profiles" ADD COLUMN     "base_salary" DOUBLE PRECISION,
ADD COLUMN     "employment_type" TEXT NOT NULL DEFAULT 'contractor';

-- AlterTable
ALTER TABLE "doctor_profiles" ALTER COLUMN "clinic_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "pharmacies" ADD COLUMN     "owner_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "legal_documents" TEXT,
ADD COLUMN     "verification_deadline" TIMESTAMP(3),
ADD COLUMN     "verification_status" TEXT NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "family_relationships" (
    "id" TEXT NOT NULL,
    "caregiver_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "transaction_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_specialties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_profile_specialties" (
    "doctor_id" TEXT NOT NULL,
    "specialty_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_profile_specialties_pkey" PRIMARY KEY ("doctor_id","specialty_id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_accepted" BOOLEAN NOT NULL DEFAULT false,
    "sender_id" TEXT NOT NULL,
    "clinic_id" TEXT,
    "pharmacy_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beta_feedbacks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beta_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_documents" (
    "id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "document_url" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_documents" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
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

    CONSTRAINT "clinic_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_relationships_caregiver_id_patient_id_key" ON "family_relationships"("caregiver_id", "patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_specialties_name_key" ON "doctor_specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "beta_feedbacks_type_idx" ON "beta_feedbacks"("type");

-- CreateIndex
CREATE INDEX "beta_feedbacks_status_idx" ON "beta_feedbacks"("status");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_user_id_idx" ON "push_tokens"("user_id");

-- CreateIndex
CREATE INDEX "doctor_documents_doctor_id_idx" ON "doctor_documents"("doctor_id");

-- CreateIndex
CREATE INDEX "doctor_documents_status_idx" ON "doctor_documents"("status");

-- CreateIndex
CREATE INDEX "clinic_documents_clinic_id_idx" ON "clinic_documents"("clinic_id");

-- CreateIndex
CREATE INDEX "clinic_documents_status_idx" ON "clinic_documents"("status");

-- CreateIndex
CREATE INDEX "clinic_documents_expiry_date_idx" ON "clinic_documents"("expiry_date");

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_caregiver_id_fkey" FOREIGN KEY ("caregiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_relationships" ADD CONSTRAINT "family_relationships_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profile_specialties" ADD CONSTRAINT "doctor_profile_specialties_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profile_specialties" ADD CONSTRAINT "doctor_profile_specialties_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "doctor_specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beta_feedbacks" ADD CONSTRAINT "beta_feedbacks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_documents" ADD CONSTRAINT "doctor_documents_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_documents" ADD CONSTRAINT "doctor_documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_documents" ADD CONSTRAINT "clinic_documents_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_documents" ADD CONSTRAINT "clinic_documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_documents" ADD CONSTRAINT "clinic_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
