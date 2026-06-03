-- ============================================================
-- SQL Script: Seed Test Delivery Order & Driver for OASIS PWA
-- ============================================================

-- 1. Ensure a Pharmacy exists with active status and valid coordinates (Managua, Nicaragua)
INSERT INTO "pharmacies" (
  "id", "name", "address", "latitude", "longitude", "phone", "isActive", "deliveryFee", "createdAt", "updatedAt"
)
VALUES (
  'pharmacy-test-1', 
  'Farmacia Oasis Central', 
  'Altamira d''Este, del BCN 1c al este, Managua', 
  12.128500, 
  -86.251400, 
  '+505 2278-4000', 
  true, 
  45.00, 
  NOW(), 
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "latitude" = 12.128500,
  "longitude" = -86.251400,
  "isActive" = true,
  "deliveryFee" = 45.00;

-- 2. Create a Test Patient User (if not exists)
INSERT INTO "users" (
  "id", "email", "passwordHash", "name", "phone", "role", "isActive", "emailVerified", "createdAt", "updatedAt"
)
VALUES (
  'patient-test-id',
  'paciente.prueba@oasis.com',
  '$2a$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQGDIVFlYg7B77UdFm', -- 'password123'
  'Juana María Gómez',
  '+505 8877-6655',
  'patient',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET "role" = 'patient', "isActive" = true;

-- 3. Create an Active Delivery Driver User
INSERT INTO "users" (
  "id", "email", "passwordHash", "name", "phone", "role", "isActive", "emailVerified", "createdAt", "updatedAt"
)
VALUES (
  'driver-test-id',
  'repartidor.prueba@oasis.com',
  '$2a$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQGDIVFlYg7B77UdFm', -- 'password123'
  'Carlos "El Rayo" Mendoza',
  '+505 7766-5544',
  'delivery_driver',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET "role" = 'delivery_driver', "isActive" = true;

-- 4. Create/Update Delivery Driver Profile to make sure they are Available and Online (Managua)
INSERT INTO "delivery_driver_profiles" (
  "user_id", "vehicleType", "licensePlate", "isAvailable", "currentLat", "currentLng", "employment_type", "base_salary", "createdAt", "updatedAt"
)
VALUES (
  'driver-test-id',
  'motocicleta',
  'M-102948',
  true,             -- driver is online & available
  12.131000,        -- close to pharmacy
  -86.258000,
  'contractor',
  0.00,
  NOW(),
  NOW()
)
ON CONFLICT ("user_id") DO UPDATE SET
  "isAvailable" = true,
  "currentLat" = 12.131000,
  "currentLng" = -86.258000;

-- 5. Create a Sale for Delivery
INSERT INTO "sales" (
  "id", "pharmacyId", "patientId", "isDelivery", "deliveryAddress", "deliveryLat", "deliveryLng", "deliveryNotes", "status", "totalAmount", "createdAt", "updatedAt"
)
VALUES (
  'sale-test-id',
  'pharmacy-test-1',
  'patient-test-id',
  true,
  'Colonia Centroamérica, del Colegio Salvador Mendieta 2c al este',
  12.115400,
  -86.240200,
  'Entregar en portón blanco, llamar al llegar',
  'pending',
  420.00,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "status" = 'pending',
  "isDelivery" = true,
  "deliveryLat" = 12.115400,
  "deliveryLng" = -86.240200;

-- 6. Create a Pending Delivery Order referencing the sale
INSERT INTO "delivery_orders" (
  "id", "saleId", "pharmacyId", "deliveryDriverId", "patientId", "pickupAddress", "pickupLat", "pickupLng", "deliveryAddress", "deliveryLat", "deliveryLng", "status", "notes", "createdAt", "updatedAt"
)
VALUES (
  'order-test-id',
  'sale-test-id',
  'pharmacy-test-1',
  NULL, -- No driver assigned initially so it appears in available orders!
  'patient-test-id',
  'Farmacia Oasis Central, Altamira, Managua',
  12.128500,
  -86.251400,
  'Colonia Centroamérica, del Colegio Salvador Mendieta 2c al este',
  12.115400,
  -86.240200,
  'pending', -- Pending status makes it visible to drivers
  'Entregar en portón blanco, llamar al llegar. Paciente pagó en línea.',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "deliveryDriverId" = NULL,
  "status" = 'pending',
  "pickupLat" = 12.128500,
  "pickupLng" = -86.251400,
  "deliveryLat" = 12.115400,
  "deliveryLng" = -86.240200;

-- 7. Add dummy items for sale to guarantee database completeness
INSERT INTO "sale_items" (
  "id", "saleId", "medicineId", "quantity", "unitPrice", "createdAt"
)
VALUES (
  'sale-item-test-1',
  'sale-test-id',
  'cmphc5gqd000llzdi92zsew56', -- use an existing medicine ID or fallback
  2,
  210.00,
  NOW()
)
ON CONFLICT ("id") DO NOTHING;
