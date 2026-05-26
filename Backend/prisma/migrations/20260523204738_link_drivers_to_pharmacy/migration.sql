-- AlterTable
ALTER TABLE "delivery_driver_profiles" ADD COLUMN     "pharmacy_id" TEXT;

-- AddForeignKey
ALTER TABLE "delivery_driver_profiles" ADD CONSTRAINT "delivery_driver_profiles_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
