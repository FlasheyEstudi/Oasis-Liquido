# 🏝️ OASIS — Documentación Técnica Completa del Backend

> **Versión**: 1.0.0  
> **Última actualización**: 2025  
> **Stack**: Next.js 16 · TypeScript 5 · Prisma ORM · SQLite  
> **Frontend**: React 19 · Framer Motion · Tailwind CSS · shadcn/ui  

---

## 📊 RESUMEN EJECUTIVO

| Métrica | Cantidad |
|---------|----------|
| **Módulos funcionales** | 8 |
| **Roles de usuario** | 6 |
| **Componentes frontend** | 28 |
| **Botones/Acciones totales** | 87 |
| **Campos de formulario** | 42 |
| **Endpoints API** | 39 |
| **Tablas SQL** | 17 |
| **Páginas de navegación** | 25 |

---

## 🗂️ MÓDULOS DEL SISTEMA

| # | Módulo | Descripción | Roles que acceden | Componentes |
|---|--------|-------------|-------------------|-------------|
| 1 | **Auth** | Autenticación, registro, recuperación de contraseña | Todos (público) | 4 |
| 2 | **Patient** | Dashboard, citas, recetas, farmacias, delivery | `patient` | 7 |
| 3 | **Doctor** | Dashboard, consultas, emisión de recetas | `doctor` | 2 |
| 4 | **Pharmacy** | Dashboard, inventario, dispensado, pedidos | `pharmacy_manager` | 4 |
| 5 | **Delivery** | Dashboard, rastreo, gestión de entregas | `delivery_driver` | 2 |
| 6 | **Admin** | Dashboard, gestión CRUD, auditoría | `admin` | 5 |
| 7 | **Receptionist** | Dashboard, gestión de citas en clínica | `receptionist` | 1 |
| 8 | **Profile** | Perfil de usuario, cambio de contraseña | Todos (autenticados) | 1 |

---

## 👥 ROLES DE USUARIO

| Rol | `role` value | Perfil asociado | Dashboard |
|-----|-------------|-----------------|-----------|
| Paciente | `patient` | `patient_profiles` | PatientHome |
| Médico | `doctor` | `doctor_profiles` | DoctorDashboard |
| Farmacéutico | `pharmacy_manager` | `pharmacy_manager_profiles` | PharmacyDashboard |
| Repartidor | `delivery_driver` | `delivery_driver_profiles` | DriverHome |
| Recepcionista | `receptionist` | `receptionist_profiles` | ReceptionistDashboard |
| Administrador | `admin` | — | AdminHome |

---

## 🗄️ TABLAS SQL — ESQUEMA COMPLETO

### Diagrama de Relaciones

```
users ─┬─ patient_profiles (1:1)
       ├─ doctor_profiles (1:1)
       ├─ pharmacy_manager_profiles (1:1)
       ├─ delivery_driver_profiles (1:1)
       └─ receptionist_profiles (1:1)

clinics ─── doctor_profiles (1:N)
         └─ appointments (1:N)

pharmacies ─── pharmacy_manager_profiles (1:1)
            ├─ inventory (1:N)
            └─ sales (1:N)

appointments ─── prescriptions (1:1)

medicines ─── inventory (1:N)
           ├─ prescription_lines (1:N)
           └─ sale_items (1:N)

prescriptions ─── prescription_lines (1:N)

sales ─── sale_items (1:N)
       └─ delivery_orders (1:1)

delivery_orders ─── delivery_routes (1:N)

audit_logs (independiente)
refresh_tokens (independiente)
```

### Tabla 1: `users`

```sql
CREATE TABLE users (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  phone           TEXT,
  role            TEXT NOT NULL CHECK(role IN ('patient','doctor','pharmacy_manager','delivery_driver','receptionist','admin')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

### Tabla 2: `patient_profiles`

```sql
CREATE TABLE patient_profiles (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth   DATE,
  blood_type      TEXT CHECK(blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  allergies       TEXT,        -- JSON array: ["Penicilina","Sulfonamidas"]
  medical_notes   TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla 3: `doctor_profiles`

```sql
CREATE TABLE doctor_profiles (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  clinic_id       TEXT REFERENCES clinics(id),
  specialty       TEXT NOT NULL DEFAULT 'Medicina General',
  license_number  TEXT NOT NULL UNIQUE,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doctor_clinic ON doctor_profiles(clinic_id);
```

### Tabla 4: `pharmacy_manager_profiles`

```sql
CREATE TABLE pharmacy_manager_profiles (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pharmacy_id     TEXT REFERENCES pharmacies(id),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla 5: `delivery_driver_profiles`

```sql
CREATE TABLE delivery_driver_profiles (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type    TEXT NOT NULL DEFAULT 'motocicleta',
  license_plate   TEXT,
  is_available    BOOLEAN NOT NULL DEFAULT TRUE,
  current_lat     REAL,
  current_lng     REAL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla 6: `receptionist_profiles`

```sql
CREATE TABLE receptionist_profiles (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  clinic_id       TEXT REFERENCES clinics(id),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla 7: `clinics`

```sql
CREATE TABLE clinics (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name            TEXT NOT NULL,
  address         TEXT NOT NULL,
  latitude        REAL NOT NULL DEFAULT 19.4326,
  longitude       REAL NOT NULL DEFAULT -99.1332,
  phone           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clinics_active ON clinics(is_active);
```

### Tabla 8: `pharmacies`

```sql
CREATE TABLE pharmacies (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name            TEXT NOT NULL,
  address         TEXT NOT NULL,
  latitude        REAL NOT NULL DEFAULT 19.4326,
  longitude       REAL NOT NULL DEFAULT -99.1332,
  phone           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_fee    REAL NOT NULL DEFAULT 29.90,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pharmacies_active ON pharmacies(is_active);
```

### Tabla 9: `medicines`

```sql
CREATE TABLE medicines (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name            TEXT NOT NULL,
  generic_name    TEXT,
  description     TEXT,
  dosage_form     TEXT,       -- tableta, cápsula, jarabe, inyección, etc.
  concentration   TEXT,       -- 500mg, 10mg/ml, etc.
  requires_prescription BOOLEAN NOT NULL DEFAULT TRUE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_generic ON medicines(generic_name);
```

### Tabla 10: `inventory`

```sql
CREATE TABLE inventory (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  pharmacy_id     TEXT NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id     TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  quantity        INTEGER NOT NULL DEFAULT 0,
  min_stock       INTEGER NOT NULL DEFAULT 10,
  unit_price      REAL NOT NULL,
  batch_number    TEXT,
  expiration_date DATE,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pharmacy_id, medicine_id)
);

CREATE INDEX idx_inventory_pharmacy ON inventory(pharmacy_id);
CREATE INDEX idx_inventory_medicine ON inventory(medicine_id);
CREATE INDEX idx_inventory_low_stock ON inventory(pharmacy_id, quantity, min_stock);
```

### Tabla 11: `appointments`

```sql
CREATE TABLE appointments (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  patient_id        TEXT NOT NULL REFERENCES users(id),
  doctor_id         TEXT NOT NULL REFERENCES users(id),
  clinic_id         TEXT NOT NULL REFERENCES clinics(id),
  date_time         DATETIME NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 30,
  status            TEXT NOT NULL DEFAULT 'scheduled' 
                    CHECK(status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show')),
  cancellation_reason TEXT,
  notes             TEXT,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_appointments_date ON appointments(date_time);
CREATE INDEX idx_appointments_status ON appointments(status);
```

### Tabla 12: `prescriptions`

```sql
CREATE TABLE prescriptions (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  patient_id        TEXT NOT NULL REFERENCES users(id),
  doctor_id         TEXT NOT NULL REFERENCES users(id),
  clinic_id         TEXT NOT NULL REFERENCES clinics(id),
  appointment_id    TEXT REFERENCES appointments(id),
  status            TEXT NOT NULL DEFAULT 'active'
                    CHECK(status IN ('active','partially_fulfilled','fulfilled','expired','cancelled')),
  qr_code           TEXT UNIQUE,
  notes             TEXT,
  issued_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiration_date   DATE NOT NULL,
  fulfilled_at      DATETIME,
  fulfilled_pharmacy_id TEXT REFERENCES pharmacies(id),
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_qr ON prescriptions(qr_code);
CREATE INDEX idx_prescriptions_appointment ON prescriptions(appointment_id);
```

### Tabla 13: `prescription_lines`

```sql
CREATE TABLE prescription_lines (
  id                      TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  prescription_id         TEXT NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_id             TEXT NOT NULL REFERENCES medicines(id),
  quantity                INTEGER NOT NULL,
  dosage_instructions     TEXT NOT NULL,
  quantity_fulfilled      INTEGER NOT NULL DEFAULT 0,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_presc_lines_prescription ON prescription_lines(prescription_id);
CREATE INDEX idx_presc_lines_medicine ON prescription_lines(medicine_id);
```

### Tabla 14: `sales`

```sql
CREATE TABLE sales (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  pharmacy_id       TEXT NOT NULL REFERENCES pharmacies(id),
  patient_id        TEXT REFERENCES users(id),
  prescription_id   TEXT REFERENCES prescriptions(id),
  is_delivery       BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_address  TEXT,
  delivery_lat      REAL,
  delivery_lng      REAL,
  delivery_notes    TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','confirmed','preparing','ready','delivered','cancelled')),
  total_amount      REAL NOT NULL DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_pharmacy ON sales(pharmacy_id);
CREATE INDEX idx_sales_patient ON sales(patient_id);
CREATE INDEX idx_sales_status ON sales(status);
```

### Tabla 15: `sale_items`

```sql
CREATE TABLE sale_items (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sale_id         TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  medicine_id     TEXT NOT NULL REFERENCES medicines(id),
  quantity        INTEGER NOT NULL,
  unit_price      REAL NOT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
```

### Tabla 16: `delivery_orders`

```sql
CREATE TABLE delivery_orders (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sale_id           TEXT NOT NULL REFERENCES sales(id),
  pharmacy_id       TEXT NOT NULL REFERENCES pharmacies(id),
  delivery_driver_id TEXT REFERENCES users(id),
  patient_id        TEXT NOT NULL REFERENCES users(id),
  pickup_address    TEXT NOT NULL,
  pickup_lat        REAL NOT NULL,
  pickup_lng        REAL NOT NULL,
  delivery_address  TEXT NOT NULL,
  delivery_lat      REAL NOT NULL,
  delivery_lng      REAL NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending','assigned','picked_up','in_transit','delivered','cancelled')),
  assigned_at       DATETIME,
  picked_up_at      DATETIME,
  delivered_at      DATETIME,
  notes             TEXT,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delivery_sale ON delivery_orders(sale_id);
CREATE INDEX idx_delivery_pharmacy ON delivery_orders(pharmacy_id);
CREATE INDEX idx_delivery_driver ON delivery_orders(delivery_driver_id);
CREATE INDEX idx_delivery_patient ON delivery_orders(patient_id);
CREATE INDEX idx_delivery_status ON delivery_orders(status);
```

### Tabla 17: `delivery_routes`

```sql
CREATE TABLE delivery_routes (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  delivery_order_id TEXT NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  driver_lat        REAL NOT NULL,
  driver_lng        REAL NOT NULL,
  recorded_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_routes_order ON delivery_routes(delivery_order_id);
CREATE INDEX idx_routes_time ON delivery_routes(recorded_at);
```

### Tabla 18: `audit_logs`

```sql
CREATE TABLE audit_logs (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id     TEXT REFERENCES users(id),
  action      TEXT NOT NULL CHECK(action IN ('create','update','delete','login','logout')),
  entity_type TEXT NOT NULL,    -- 'user','clinic','pharmacy','appointment','prescription','sale','delivery_order','inventory'
  entity_id   TEXT,
  details     TEXT,             -- JSON con cambios: {"field": "status", "from": "scheduled", "to": "confirmed"}
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
```

### Tabla 19: `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  DATETIME NOT NULL,
  revoked_at  DATETIME,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_expires ON refresh_tokens(expires_at);
```

---

## 🔌 ENDPOINTS API — CATÁLOGO COMPLETO

### Convenciones de Naming

| Patrón | Ejemplo | Significado |
|--------|---------|-------------|
| `GET /recurso` | `GET /appointments` | Listar (con filtros query) |
| `GET /recurso/:id` | `GET /appointments/abc123` | Obtener uno |
| `POST /recurso` | `POST /appointments` | Crear |
| `PATCH /recurso/:id` | `PATCH /users/abc123` | Actualizar parcial |
| `DELETE /recurso/:id` | `DELETE /inventory/abc123` | Eliminar |
| `POST /recurso/:id/accion` | `POST /prescriptions/abc/fulfill` | Acción específica |

### Formato de Respuesta Estándar

```typescript
// Éxito
{ "success": true, "data": T, "message": "Operación exitosa" }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }

// Lista paginada
{ "success": true, "data": T[], "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 } }
```

---

### MÓDULO 1: AUTH (5 endpoints)

#### `POST /api/auth/login`
- **Body**: `{ email: string, password: string }`
- **Response**: `{ user: User, access_token: string, refresh_token: string }`
- **Acción**: Login con email/password, genera JWT pair
- **Audit**: `action: 'login'`

#### `POST /api/auth/register`
- **Body**: `{ name: string, email: string, password: string, role?: 'patient' }`
- **Response**: `{ user: User, access_token: string, refresh_token: string }`
- **Acción**: Registro de nuevo paciente (solo rol patient por registro público)
- **Audit**: `action: 'create', entity_type: 'user'`

#### `POST /api/auth/forgot-password`
- **Body**: `{ email: string }`
- **Response**: `{ message: "Se envió un correo de recuperación" }`
- **Acción**: Envía email con token de reset (expira en 1h)

#### `POST /api/auth/reset-password`
- **Body**: `{ token: string, new_password: string }`
- **Response**: `{ message: "Contraseña actualizada" }`
- **Acción**: Valida token y actualiza contraseña

#### `POST /api/auth/refresh`
- **Body**: `{ refresh_token: string }`
- **Response**: `{ access_token: string, refresh_token: string }`
- **Acción**: Renueva el token pair, revoca el refresh_token anterior

---

### MÓDULO 2: USERS (5 endpoints)

#### `GET /api/users`
- **Query**: `?role=patient&search=carlos&page=1&limit=20`
- **Auth**: `admin`
- **Response**: `{ data: User[], pagination }`

#### `POST /api/users`
- **Auth**: `admin`
- **Body**: `{ name, email, password, role, phone? }`
- **Response**: `{ data: User }`
- **Audit**: `action: 'create', entity_type: 'user'`

#### `PATCH /api/users/:id`
- **Auth**: `admin` (cualquier usuario) o propio (`:id = me`)
- **Body**: `{ name?, email?, phone?, role?, is_active? }`
- **Response**: `{ data: User }`
- **Audit**: `action: 'update', entity_type: 'user'`

#### `GET /api/auth/me`
- **Auth**: Cualquier rol autenticado
- **Response**: `{ data: User }` (con perfil según rol)
- **Acción**: Retorna el usuario autenticado con su perfil completo

#### `PATCH /api/users/me/patient-profile`
- **Auth**: `patient`
- **Body**: `{ date_of_birth?, blood_type?, allergies?, medical_notes? }`
- **Response**: `{ data: PatientProfile }`
- **Audit**: `action: 'update', entity_type: 'user'`

---

### MÓDULO 3: APPOINTMENTS (4 endpoints)

#### `GET /api/appointments`
- **Query**: `?patient_id=&doctor_id=&clinic_id=&status=&date_from=&date_to=&limit=20&page=1`
- **Auth**: Todos (filtra por rol: patient ve propias, doctor ve propias, admin ve todas)
- **Response**: `{ data: Appointment[], pagination }`

#### `GET /api/appointments/:id`
- **Auth**: Propietario (patient/doctor), `admin`, `receptionist` (misma clínica)
- **Response**: `{ data: Appointment }` (con patient, doctor, clinic)

#### `POST /api/appointments`
- **Auth**: `patient`
- **Body**: `{ doctor_id, clinic_id, date_time, duration_minutes?: 30, notes? }`
- **Response**: `{ data: Appointment }`
- **Audit**: `action: 'create', entity_type: 'appointment'`

#### `PATCH /api/appointments/:id/status`
- **Auth**: Depende del estado:
  - `scheduled → confirmed`: `receptionist` o `doctor`
  - `confirmed → in_progress`: `doctor`
  - `scheduled/confirmed → cancelled`: `patient`, `receptionist`, `doctor`
  - `in_progress → completed`: `doctor`
  - `* → no_show`: `receptionist` o `doctor`
- **Body**: `{ status, cancellation_reason? }`
- **Response**: `{ data: Appointment }`
- **Audit**: `action: 'update', entity_type: 'appointment'`

---

### MÓDULO 4: CLINICS (4 endpoints)

#### `GET /api/clinics`
- **Query**: `?search=&is_active=true`
- **Auth**: Público (para NewAppointment), `admin` (ve todas)
- **Response**: `{ data: Clinic[] }`

#### `POST /api/clinics`
- **Auth**: `admin`
- **Body**: `{ name, address, latitude?, longitude?, phone? }`
- **Response**: `{ data: Clinic }`
- **Audit**: `action: 'create', entity_type: 'clinic'`

#### `PATCH /api/clinics/:id`
- **Auth**: `admin`
- **Body**: `{ name?, address?, latitude?, longitude?, phone?, is_active? }`
- **Response**: `{ data: Clinic }`
- **Audit**: `action: 'update', entity_type: 'clinic'`

#### `GET /api/clinics/:id/doctors`
- **Auth**: Público
- **Response**: `{ data: DoctorWithProfile[] }`
- **Acción**: Lista doctores activos de una clínica (con specialty y profile)

---

### MÓDULO 5: PHARMACIES (4 endpoints)

#### `GET /api/pharmacies`
- **Query**: `?search=&lat=&lng=&radius_km=10&medicine_ids=&is_active=true`
- **Auth**: Público
- **Response**: `{ data: Pharmacy[] }`

#### `POST /api/pharmacies`
- **Auth**: `admin`
- **Body**: `{ name, address, latitude?, longitude?, phone?, delivery_fee? }`
- **Response**: `{ data: Pharmacy }`
- **Audit**: `action: 'create', entity_type: 'pharmacy'`

#### `PATCH /api/pharmacies/:id`
- **Auth**: `admin`
- **Body**: `{ name?, address?, latitude?, longitude?, phone?, is_active?, delivery_fee? }`
- **Response**: `{ data: Pharmacy }`
- **Audit**: `action: 'update', entity_type: 'pharmacy'`

#### `GET /api/pharmacies/:id`
- **Auth**: Público
- **Response**: `{ data: Pharmacy }` (con inventory resumido)

---

### MÓDULO 6: INVENTORY (3 endpoints)

#### `GET /api/pharmacies/:id/inventory`
- **Query**: `?search=&low_stock=true&limit=50&page=1`
- **Auth**: `pharmacy_manager` (misma farmacia), `admin`
- **Response**: `{ data: InventoryItem[], pagination }`

#### `POST /api/pharmacies/:id/inventory/adjust`
- **Auth**: `pharmacy_manager` (misma farmacia), `admin`
- **Body**: `{ medicine_id, quantity_change, new_price?, reason? }`
- **Response**: `{ data: InventoryItem }`
- **Audit**: `action: 'update', entity_type: 'inventory'`
- **Acción**: Ajusta stock (+ o -). Si quantity_change es negativo y queda < 0, error.

#### `POST /api/pharmacies/:id/inventory/seed`
- **Auth**: `admin`
- **Body**: `{ items: [{ medicine_id, quantity, unit_price, min_stock? }] }`
- **Response**: `{ data: InventoryItem[] }`
- **Acción**: Carga inicial de inventario (bulk upsert)

---

### MÓDULO 7: MEDICINES (2 endpoints)

#### `GET /api/medicines`
- **Query**: `?search=amoxicilina&requires_prescription=true&limit=50`
- **Auth**: Público
- **Response**: `{ data: Medicine[] }`

#### `GET /api/medicines/:id`
- **Auth**: Público
- **Response**: `{ data: Medicine }`

---

### MÓDULO 8: PRESCRIPTIONS (5 endpoints)

#### `GET /api/prescriptions`
- **Query**: `?patient_id=&doctor_id=&status=&limit=20&page=1`
- **Auth**: `patient` (propias), `doctor` (emitidas), `pharmacy_manager`, `admin`
- **Response**: `{ data: Prescription[], pagination }`

#### `GET /api/prescriptions/:id`
- **Auth**: Propietario (patient/doctor), `pharmacy_manager`, `admin`
- **Response**: `{ data: Prescription }` (con lines, medicines, doctor, patient)

#### `POST /api/prescriptions`
- **Auth**: `doctor`
- **Body**: `{ patient_id, clinic_id, appointment_id?, expiration_date, notes?, lines: [{ medicine_id, quantity, dosage_instructions }] }`
- **Response**: `{ data: Prescription }` (con qr_code generado)
- **Audit**: `action: 'create', entity_type: 'prescription'`

#### `POST /api/prescriptions/validate`
- **Auth**: `pharmacy_manager`
- **Body**: `{ qr_data: string }`
- **Response**: `{ data: Prescription }` (con lines y medicines, valida que no esté expirada/cancelada)
- **Acción**: Valida QR de receta, retorna datos para dispensar

#### `POST /api/prescriptions/:id/fulfill`
- **Auth**: `pharmacy_manager`
- **Body**: `{ pharmacy_id, items: [{ prescription_line_id, quantity_fulfilled }] }`
- **Response**: `{ data: Prescription }` (actualizada)
- **Audit**: `action: 'update', entity_type: 'prescription'`
- **Acción**: Dispensa parcial o total. Actualiza stock (decrementa inventory). Si todas las líneas fulfilled → status `fulfilled`.

---

### MÓDULO 9: SALES / DELIVERY (5 endpoints)

#### `POST /api/pharmacies/:id/sales`
- **Auth**: `patient`
- **Body**: `{ items: [{ medicine_id, quantity }], prescription_id?, is_delivery: true, delivery_address?, delivery_lat?, delivery_lng?, notes? }`
- **Response**: `{ data: Sale }` (con delivery_order si is_delivery=true)
- **Audit**: `action: 'create', entity_type: 'sale'`
- **Acción**: Crea venta + decrementa inventario + crea delivery_order si es delivery

#### `GET /api/delivery-orders`
- **Query**: `?pharmacy_id=&delivery_driver_id=&patient_id=&status=&limit=20&page=1`
- **Auth**: `patient` (propios), `pharmacy_manager` (de su farmacia), `delivery_driver` (asignados), `admin`
- **Response**: `{ data: DeliveryOrder[], pagination }`

#### `GET /api/delivery-orders/:id`
- **Auth**: Propietario, `pharmacy_manager`, `delivery_driver` (asignado), `admin`
- **Response**: `{ data: DeliveryOrder }` (con sale, items, pharmacy, driver)

#### `PATCH /api/delivery-orders/:id/status`
- **Auth**: 
  - `pharmacy_manager` → `pending → assigned` (asignar driver)
  - `delivery_driver` → `assigned → picked_up`, `picked_up → in_transit`, `in_transit → delivered`
- **Body**: `{ status, delivery_driver_id? }`
- **Response**: `{ data: DeliveryOrder }`
- **Audit**: `action: 'update', entity_type: 'delivery_order'`

#### `GET /api/delivery-orders/:id/tracking`
- **Auth**: `patient` (propietario), `delivery_driver` (asignado), `admin`
- **Response**: `{ data: { order: DeliveryOrder, route: DeliveryRoute[] } }`
- **Acción**: Retorna la ruta GPS del driver (últimos N puntos)

---

### MÓDULO 10: ADMIN (2 endpoints)

#### `GET /api/admin/stats`
- **Auth**: `admin`
- **Response**: `{ data: { total_users, total_patients, total_doctors, total_appointments, total_prescriptions, appointments_today, pending_deliveries, low_stock_items } }`

#### `GET /api/audit-logs`
- **Query**: `?user_id=&action=&entity_type=&date_from=&date_to=&page=1&limit=20`
- **Auth**: `admin`
- **Response**: `{ data: AuditLog[], pagination }`

---

### MÓDULO 11: PROFILE (2 endpoints)

#### `PATCH /api/users/me`
- **Auth**: Cualquier usuario autenticado
- **Body**: `{ name?, phone? }`
- **Response**: `{ data: User }`
- **Audit**: `action: 'update', entity_type: 'user'`

#### `POST /api/users/me/change-password`
- **Auth**: Cualquier usuario autenticado
- **Body**: `{ current_password, new_password }`
- **Response**: `{ message: "Contraseña actualizada" }`
- **Acción**: Valida contraseña actual, actualiza con nueva

---

## 🔘 INVENTARIO COMPLETO DE BOTONES/ACCIONES

### Auth Module (8 botones)

| Componente | Botón | Acción | Endpoint |
|------------|-------|--------|----------|
| LoginForm | "Iniciar sesión" | Submit login | `POST /auth/login` |
| LoginForm | "¿Olvidaste tu contraseña?" | Navegar | — |
| LoginForm | "Crear cuenta" | Navegar | — |
| LoginForm | 👁 Toggle password | Mostrar/ocultar | — |
| RegisterForm | "Crear cuenta" | Submit registro | `POST /auth/register` |
| RegisterForm | "Iniciar sesión" | Navegar | — |
| RegisterForm | 👁 Toggle password x2 | Mostrar/ocultar | — |
| ForgotPasswordForm | "Enviar enlace" | Submit email | `POST /auth/forgot-password` |
| ResetPasswordForm | "Restablecer" | Submit nueva contraseña | `POST /auth/reset-password` |

### Patient Module (28 botones)

| Componente | Botón | Acción | Endpoint |
|------------|-------|--------|----------|
| PatientHome | "Agendar" | Navegar | — |
| PatientHome | "Agendar cita" | Navegar | — |
| PatientHome | "Ver recetas" | Navegar | — |
| PatientHome | "Farmacias" | Navegar | — |
| PatientHome | "Delivery" | Navegar | — |
| PatientHome | "Ver todas" recetas | Navegar | — |
| PatientHome | Card cita → click | Navegar | — |
| PatientHome | Card receta → click | Navegar | — |
| AppointmentList | "Nueva cita" | Navegar | — |
| AppointmentList | Tabs filtro | Cambiar estado | — |
| AppointmentList | "Cancelar cita" | Abrir dialog | — |
| AppointmentList | "Sí, cancelar" | Cancelar cita | `PATCH /appointments/:id/status` |
| AppointmentList | "No, mantener" | Cerrar dialog | — |
| NewAppointment | "Anterior" / "Siguiente" | Step nav | — |
| NewAppointment | Card clínica → click | Seleccionar | `GET /clinics` |
| NewAppointment | Card doctor → click | Seleccionar | `GET /clinics/:id/doctors` |
| NewAppointment | Slot horario → click | Seleccionar | — |
| NewAppointment | "Confirmar cita" | Crear cita | `POST /appointments` |
| PrescriptionList | Tabs filtro | Cambiar estado | — |
| PrescriptionList | "QR" por receta | Abrir dialog | — |
| PrescriptionList | "Buscar farmacias" | Navegar | — |
| PrescriptionDetail | "Buscar farmacias con stock" | Navegar | — |
| PharmacyMap | Toggle Mapa/Lista | Cambiar vista | — |
| PharmacyMap | Marker/card → click | Navegar | — |
| PharmacyMap | "Pedir domicilio" | Navegar | — |
| DeliveryRequest | "Agregar" medicamento | Abrir búsqueda | `GET /medicines?search=` |
| DeliveryRequest | +/- cantidad | Ajustar item | — |
| DeliveryRequest | 🗑️ Eliminar item | Quitar item | — |
| DeliveryRequest | "Confirmar pedido" | Crear venta+delivery | `POST /pharmacies/:id/sales` |
| OrderTracking | Expandir/colapsar orden | Toggle UI | — |
| OrderTracking | "Llamar" conductor | tel: link | — |

### Doctor Module (8 botones)

| Componente | Botón | Acción | Endpoint |
|------------|-------|--------|----------|
| DoctorDashboard | "Iniciar consulta" | Navegar + cambiar status | `PATCH /appointments/:id/status` |
| DoctorDashboard | "Continuar consulta" | Navegar | — |
| DoctorDashboard | "Ver recetas emitidas" | Navegar | — |
| Consultation | Card cita → click | Seleccionar | `GET /appointments?status=confirmed` |
| Consultation | "Continuar a receta" | Step nav | — |
| Consultation | "Agregar medicamento" | Agregar línea | `GET /medicines?search=` |
| Consultation | 🗑️ Eliminar línea | Quitar línea | — |
| Consultation | "Emitir receta" | Crear receta | `POST /prescriptions` |
| Consultation | "Finalizar consulta" | Completar cita | `PATCH /appointments/:id/status` |

### Pharmacy Module (14 botones)

| Componente | Botón | Acción | Endpoint |
|------------|-------|--------|----------|
| PharmacyDashboard | "Escanear QR" | Navegar | — |
| PharmacyDashboard | "Inventario" | Navegar | — |
| PharmacyDashboard | "Pedidos" | Navegar | — |
| PharmacyDashboard | Card receta → click | Navegar | — |
| Inventory | Toggle "Solo stock bajo" | Filtrar | — |
| Inventory | "Ajustar" por item | Abrir dialog | — |
| Inventory | +/- cantidad ajuste | Cambiar valor | — |
| Inventory | "Guardar ajuste" | Actualizar stock | `POST /pharmacies/:id/inventory/adjust` |
| Fulfillment | "Validar" QR | Validar receta | `POST /prescriptions/validate` |
| Fulfillment | Checkbox por línea | Marcar para dispensar | — |
| Fulfillment | "Dispensar Receta" | Fulfill receta | `POST /prescriptions/:id/fulfill` |
| Fulfillment | "Escanear otra receta" | Reset state | — |
| OrderManagement | Tabs filtro | Cambiar estado | — |
| OrderManagement | "Asignar repartidor" | Abrir dialog | `GET /users?role=delivery_driver` |
| OrderManagement | "Asignar" en dialog | Asignar driver | `PATCH /delivery-orders/:id/status` |

### Delivery Module (6 botones)

| Componente | Botón | Acción | Endpoint |
|------------|-------|--------|----------|
| DriverHome | "Recoger pedido" | Cambiar status | `PATCH /delivery-orders/:id/status` |
| DriverHome | "Iniciar ruta" | Cambiar status | `PATCH /delivery-orders/:id/status` |
| DriverHome | "Marcar entregado" | Cambiar status | `PATCH /delivery-orders/:id/status` |
| DeliveryDetail | "Recoger pedido" | Cambiar status | `PATCH /delivery-orders/:id/status` |
| DeliveryDetail | "Iniciar ruta" | Cambiar status | `PATCH /delivery-orders/:id/status` |
| DeliveryDetail | "Marcar como entregado" | Cambiar status | `PATCH /delivery-orders/:id/status` |

### Admin Module (13 botones)

| Componente | Botón | Acción | Endpoint |
|------------|-------|--------|----------|
| AdminHome | "Gestionar Clínicas" | Navegar | — |
| AdminHome | "Gestionar Farmacias" | Navegar | — |
| AdminHome | "Gestionar Usuarios" | Navegar | — |
| AdminHome | "Ver Auditoría" | Navegar | — |
| ManageClinics | "Nueva Clínica" | Abrir dialog | — |
| ManageClinics | ✏️ Editar | Abrir dialog | — |
| ManageClinics | "Crear clínica" / "Guardar cambios" | CRUD | `POST /clinics` o `PATCH /clinics/:id` |
| ManagePharmacies | "Nueva Farmacia" | Abrir dialog | — |
| ManagePharmacies | ✏️ Editar | Abrir dialog | — |
| ManagePharmacies | "Crear farmacia" / "Guardar cambios" | CRUD | `POST /pharmacies` o `PATCH /pharmacies/:id` |
| ManageUsers | "Nuevo Usuario" | Abrir dialog | — |
| ManageUsers | ✏️ Editar | Abrir dialog | — |
| ManageUsers | "Crear usuario" / "Guardar cambios" | CRUD | `POST /users` o `PATCH /users/:id` |
| AuditLogs | "Filtros" toggle | Mostrar/ocultar | — |
| AuditLogs | Pills acción | Filtrar | — |
| AuditLogs | "Limpiar" | Reset filtros | — |
| AuditLogs | "Anterior" / "Siguiente" | Paginación | — |

### Receptionist Module (3 botones)

| Componente | Botón | Acción | Endpoint |
|------------|-------|--------|----------|
| ReceptionistDashboard | "Confirmar" | Confirmar cita | `PATCH /appointments/:id/status` |
| ReceptionistDashboard | "Iniciar" | Iniciar cita | `PATCH /appointments/:id/status` |
| ReceptionistDashboard | "Cancelar" | Cancelar cita | `PATCH /appointments/:id/status` |

### Profile Module (5 botones)

| Componente | Botón | Acción | Endpoint |
|------------|-------|--------|----------|
| ProfileScreen | ✏️ Editar | Habilitar edición | — |
| ProfileScreen | ✖ Cancelar | Descartar cambios | — |
| ProfileScreen | "Guardar cambios" | Actualizar perfil | `PATCH /users/me` |
| ProfileScreen | "Actualizar contraseña" | Cambiar contraseña | `POST /users/me/change-password` |
| ProfileScreen | "Cerrar sesión" | Logout | — |

**TOTAL DE BOTONES/ACCIONES: 87**

---

## 📁 ESTRUCTURA RECOMENDADA DEL BACKEND

```
src/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts           # POST /api/auth/login
│       │   ├── register/route.ts        # POST /api/auth/register
│       │   ├── forgot-password/route.ts # POST /api/auth/forgot-password
│       │   ├── reset-password/route.ts  # POST /api/auth/reset-password
│       │   ├── refresh/route.ts         # POST /api/auth/refresh
│       │   └── me/route.ts              # GET /api/auth/me
│       │
│       ├── users/
│       │   ├── route.ts                 # GET /api/users | POST /api/users
│       │   ├── [id]/route.ts            # PATCH /api/users/:id
│       │   └── me/
│       │       ├── route.ts             # PATCH /api/users/me
│       │       ├── patient-profile/route.ts  # PATCH /api/users/me/patient-profile
│       │       └── change-password/route.ts  # POST /api/users/me/change-password
│       │
│       ├── appointments/
│       │   ├── route.ts                 # GET /api/appointments | POST /api/appointments
│       │   └── [id]/
│       │       ├── route.ts             # GET /api/appointments/:id
│       │       └── status/route.ts      # PATCH /api/appointments/:id/status
│       │
│       ├── clinics/
│       │   ├── route.ts                 # GET /api/clinics | POST /api/clinics
│       │   └── [id]/
│       │       ├── route.ts             # PATCH /api/clinics/:id
│       │       └── doctors/route.ts     # GET /api/clinics/:id/doctors
│       │
│       ├── pharmacies/
│       │   ├── route.ts                 # GET /api/pharmacies | POST /api/pharmacies
│       │   └── [id]/
│       │       ├── route.ts             # GET /api/pharmacies/:id | PATCH /api/pharmacies/:id
│       │       ├── inventory/
│       │       │   └── route.ts         # GET /api/pharmacies/:id/inventory
│       │       ├── inventory/
│       │       │   └── adjust/route.ts  # POST /api/pharmacies/:id/inventory/adjust
│       │       └── sales/route.ts       # POST /api/pharmacies/:id/sales
│       │
│       ├── medicines/
│       │   ├── route.ts                 # GET /api/medicines
│       │   └── [id]/route.ts            # GET /api/medicines/:id
│       │
│       ├── prescriptions/
│       │   ├── route.ts                 # GET /api/prescriptions | POST /api/prescriptions
│       │   ├── validate/route.ts        # POST /api/prescriptions/validate
│       │   └── [id]/
│       │       ├── route.ts             # GET /api/prescriptions/:id
│       │       └── fulfill/route.ts     # POST /api/prescriptions/:id/fulfill
│       │
│       ├── delivery-orders/
│       │   ├── route.ts                 # GET /api/delivery-orders
│       │   └── [id]/
│       │       ├── route.ts             # GET /api/delivery-orders/:id
│       │       ├── status/route.ts      # PATCH /api/delivery-orders/:id/status
│       │       └── tracking/route.ts    # GET /api/delivery-orders/:id/tracking
│       │
│       └── admin/
│           ├── stats/route.ts           # GET /api/admin/stats
│           └── audit-logs/route.ts      # GET /api/admin/audit-logs
│
├── lib/
│   ├── db.ts                            # Prisma client singleton
│   ├── auth/
│   │   ├── jwt.ts                       # signAccessToken, verifyAccessToken, signRefreshToken
│   │   ├── middleware.ts                # withAuth(handler, { roles?: string[] })
│   │   └── password.ts                  # hashPassword, verifyPassword
│   ├── validators/
│   │   ├── auth.ts                      # loginSchema, registerSchema, etc. (Zod)
│   │   ├── appointment.ts              # createAppointmentSchema, updateStatusSchema
│   │   ├── prescription.ts             # createPrescriptionSchema, fulfillSchema
│   │   ├── user.ts                      # createUserSchema, updateUserSchema
│   │   ├── clinic.ts                    # createClinicSchema, updateClinicSchema
│   │   ├── pharmacy.ts                  # createPharmacySchema, adjustInventorySchema
│   │   ├── sale.ts                      # createSaleSchema
│   │   └── delivery.ts                  # updateDeliveryStatusSchema
│   ├── services/
│   │   ├── auth.service.ts              # login, register, refreshTokens, forgotPassword, resetPassword
│   │   ├── user.service.ts             # getUsers, createUser, updateUser, getMe
│   │   ├── appointment.service.ts       # getAppointments, createAppointment, updateStatus
│   │   ├── clinic.service.ts            # getClinics, createClinic, updateClinic, getClinicDoctors
│   │   ├── pharmacy.service.ts          # getPharmacies, createPharmacy, updatePharmacy
│   │   ├── inventory.service.ts         # getInventory, adjustInventory, seedInventory
│   │   ├── medicine.service.ts          # getMedicines, getMedicine
│   │   ├── prescription.service.ts      # getPrescriptions, createPrescription, validatePrescription, fulfillPrescription
│   │   ├── sale.service.ts              # createSale (con delivery order creation)
│   │   ├── delivery.service.ts          # getDeliveryOrders, updateDeliveryStatus, getTracking
│   │   ├── audit.service.ts             # getAuditLogs, createAuditLog
│   │   └── admin.service.ts             # getAdminStats
│   └── utils/
│       ├── api-response.ts              # successResponse, errorResponse, paginatedResponse
│       ├── pagination.ts                # parsePagination, paginate
│       └── qr.ts                        # generateQRCode, validateQRFormat
│
├── prisma/
│   └── schema.prisma                    # Esquma completo (19 modelos)
│
└── types/
    └── api.ts                           # Tipos de request/response por endpoint
```

---

## 🔐 MIDDLEWARE DE AUTENTICACIÓN

```typescript
// lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';

type Role = 'patient' | 'doctor' | 'pharmacy_manager' | 'delivery_driver' | 'receptionist' | 'admin';

interface AuthOptions {
  roles?: Role[];
  allowSelf?: boolean;  // Permite acceso al propio recurso (:id = userId)
}

export function withAuth(
  handler: (req: NextRequest, ctx: { params: Record<string, string> }, userId: string, userRole: Role) => Promise<NextResponse>,
  options?: AuthOptions
) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token requerido' } }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: { code: 'TOKEN_INVALID', message: 'Token inválido o expirado' } }, { status: 401 });
    }

    if (options?.roles && !options.roles.includes(payload.role as Role)) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Sin permisos' } }, { status: 403 });
    }

    return handler(req, ctx, payload.userId, payload.role as Role);
  };
}
```

---

## 📋 CAMPOS DE FORMULARIO COMPLETOS

| Componente | Campo | Tipo | Validación | Endpoint |
|------------|-------|------|------------|----------|
| LoginForm | email | email | requerido, formato email | POST /auth/login |
| LoginForm | password | password | requerido, min 8 chars | POST /auth/login |
| RegisterForm | name | text | requerido, min 2 chars | POST /auth/register |
| RegisterForm | email | email | requerido, formato email | POST /auth/register |
| RegisterForm | password | password | requerido, min 8, 1 mayús, 1 número | POST /auth/register |
| RegisterForm | confirmPassword | password | debe coincidir con password | POST /auth/register |
| ForgotPasswordForm | email | email | requerido | POST /auth/forgot-password |
| ResetPasswordForm | token | text | requerido | POST /auth/reset-password |
| ResetPasswordForm | newPassword | password | requerido, min 8 | POST /auth/reset-password |
| ResetPasswordForm | confirmPassword | password | debe coincidir | POST /auth/reset-password |
| NewAppointment | selectedClinicId | selection | requerido | GET /clinics |
| NewAppointment | selectedDoctorId | selection | requerido | GET /clinics/:id/doctors |
| NewAppointment | selectedDate | calendar | requerido, fecha futura | — |
| NewAppointment | selectedTime | time slot | requerido | — |
| DeliveryRequest | deliveryAddress | text | requerido | POST /pharmacies/:id/sales |
| DeliveryRequest | notes | textarea | opcional | POST /pharmacies/:id/sales |
| DeliveryRequest | medicineSearch | search | — | GET /medicines?search= |
| DeliveryRequest | quantity per item | number | min 1 | POST /pharmacies/:id/sales |
| Consultation | notes | textarea | opcional | PATCH /appointments/:id |
| Consultation | medicine_id por línea | select | requerido | GET /medicines?search= |
| Consultation | quantity por línea | number | min 1 | POST /prescriptions |
| Consultation | dosage_instructions | text | requerido por línea | POST /prescriptions |
| ManageClinics | name | text | requerido | POST/PATCH /clinics |
| ManageClinics | address | text | requerido | POST/PATCH /clinics |
| ManageClinics | latitude | number | opcional, default 19.4326 | POST/PATCH /clinics |
| ManageClinics | longitude | number | opcional, default -99.1332 | POST/PATCH /clinics |
| ManageClinics | phone | text | opcional | POST/PATCH /clinics |
| ManagePharmacies | name | text | requerido | POST/PATCH /pharmacies |
| ManagePharmacies | address | text | requerido | POST/PATCH /pharmacies |
| ManagePharmacies | latitude | number | opcional | POST/PATCH /pharmacies |
| ManagePharmacies | longitude | number | opcional | POST/PATCH /pharmacies |
| ManagePharmacies | phone | text | opcional | POST/PATCH /pharmacies |
| ManageUsers | name | text | requerido | POST/PATCH /users |
| ManageUsers | email | email | requerido, formato | POST/PATCH /users |
| ManageUsers | password | password | requerido (solo create), min 8 | POST /users |
| ManageUsers | role | select | requerido, enum roles | POST/PATCH /users |
| ManageUsers | phone | text | opcional | POST/PATCH /users |
| Inventory | searchQuery | search | — | GET /pharmacies/:id/inventory |
| Inventory | quantityChange | number | requerido | POST /pharmacies/:id/inventory/adjust |
| Inventory | newPrice | number | opcional | POST /pharmacies/:id/inventory/adjust |
| Fulfillment | qrData | text/camera | requerido | POST /prescriptions/validate |
| Fulfillment | toFulfill por línea | number | min 0 | POST /prescriptions/:id/fulfill |
| ProfileScreen | name | text | requerido | PATCH /users/me |
| ProfileScreen | phone | text | opcional | PATCH /users/me |
| ProfileScreen | dateOfBirth | date | opcional | PATCH /users/me/patient-profile |
| ProfileScreen | bloodType | text | opcional, enum | PATCH /users/me/patient-profile |
| ProfileScreen | allergies | textarea | opcional | PATCH /users/me/patient-profile |
| ProfileScreen | medicalNotes | textarea | opcional | PATCH /users/me/patient-profile |
| ProfileScreen | currentPassword | password | requerido | POST /users/me/change-password |
| ProfileScreen | newPassword | password | requerido, min 8 | POST /users/me/change-password |
| ProfileScreen | confirmPassword | password | debe coincidir | POST /users/me/change-password |

**TOTAL DE CAMPOS: 42**

---

## 🔄 FLUJOS CRÍTICOS DEL NEGOCIO

### Flujo 1: Paciente agenda cita

```
PatientHome → NewAppointment (4 steps)
  1. Seleccionar clínica     → GET /clinics
  2. Seleccionar doctor      → GET /clinics/:id/doctors
  3. Seleccionar fecha/hora  → (local)
  4. Confirmar               → POST /appointments
```

### Flujo 2: Doctor emite receta

```
DoctorDashboard → Consultation (3 steps)
  1. Seleccionar cita activa  → GET /appointments?status=confirmed
  2. Notas de consulta        → (local)
  3. Emitir receta            → POST /prescriptions
     + Finalizar consulta     → PATCH /appointments/:id/status {status: 'completed'}
```

### Flujo 3: Farmacia dispensa receta

```
PharmacyDashboard → Fulfillment
  1. Escanear QR               → POST /prescriptions/validate
  2. Verificar líneas           → (local, checkboxes)
  3. Dispensar                  → POST /prescriptions/:id/fulfill
     (decrementa inventario automáticamente)
```

### Flujo 4: Paciente pide delivery

```
PatientHome → PharmacyMap → DeliveryRequest → OrderTracking
  1. Buscar farmacia           → GET /pharmacies?lat=&lng=
  2. Ver medicamentos          → GET /pharmacies/:id/inventory
  3. Agregar items             → GET /medicines?search=
  4. Confirmar pedido          → POST /pharmacies/:id/sales
     (crea sale + delivery_order automáticamente)
  5. Rastrear pedido           → GET /delivery-orders/:id/tracking (polling)
```

### Flujo 5: Repartidor entrega pedido

```
DriverHome → DeliveryDetail
  1. Ver pedidos asignados     → GET /delivery-orders?delivery_driver_id=&status=assigned
  2. Recoger pedido            → PATCH /delivery-orders/:id/status {status: 'picked_up'}
  3. Iniciar ruta              → PATCH /delivery-orders/:id/status {status: 'in_transit'}
  4. Marcar entregado          → PATCH /delivery-orders/:id/status {status: 'delivered'}
```

### Flujo 6: Recepcionista gestiona citas

```
ReceptionistDashboard
  1. Ver citas del día          → GET /appointments?clinic_id=
  2. Confirmar cita             → PATCH /appointments/:id/status {status: 'confirmed'}
  3. Iniciar cita               → PATCH /appointments/:id/status {status: 'in_progress'}
  4. Cancelar cita              → PATCH /appointments/:id/status {status: 'cancelled'}
```

---

## ⚠️ GAPS Y PENDIENTES DETECTADOS

| # | Gap | Solución Propuesta |
|---|-----|-------------------|
| 1 | **No existe `appointment-detail` page** — AppointmentList navega ahí pero no hay componente | Crear `AppointmentDetail` component |
| 2 | **Cambio de contraseña no conectado** — ProfileScreen tiene botón sin handler | Conectar a `POST /users/me/change-password` |
| 3 | **AdminHome y AdminDashboard duplicados** — Dos dashboards casi idénticos | Eliminar AdminDashboard, usar solo AdminHome |
| 4 | **Delivery fee hardcodeado ($29.90)** — Debería venir de `pharmacies.delivery_fee` | Usar dato de la API |
| 5 | **Sin notificaciones push** — No hay sistema de notificaciones | Agregar tabla `notifications` + SSE/WebSocket |
| 6 | **Sin upload de archivos** — No hay subida de imágenes (perfil, documentos) | Agregar tabla `media` + endpoint de upload |
| 7 | **Sin validación de disponibilidad horaria** — NewAppointment no valida conflictos | Validar contra citas existentes del doctor |
| 8 | **Sin email real** — forgot-password no envía email | Integrar servicio de email (Resend/SendGrid) |

---

## 📊 RESUMEN FINAL DE LLAMADAS API POR MÓDULO

| Módulo | GET | POST | PATCH | DELETE | Total |
|--------|-----|------|-------|--------|-------|
| Auth | 1 | 4 | 0 | 0 | **5** |
| Users | 1 | 1 | 2 | 0 | **4** |
| Appointments | 2 | 1 | 1 | 0 | **4** |
| Clinics | 2 | 1 | 1 | 0 | **4** |
| Pharmacies | 2 | 1 | 1 | 0 | **4** |
| Inventory | 1 | 2 | 0 | 0 | **3** |
| Medicines | 2 | 0 | 0 | 0 | **2** |
| Prescriptions | 2 | 3 | 0 | 0 | **5** |
| Sales/Delivery | 3 | 1 | 1 | 0 | **5** |
| Admin | 2 | 0 | 0 | 0 | **2** |
| Profile | 0 | 1 | 1 | 0 | **2** |
| **TOTAL** | **18** | **14** | **7** | **0** | **39** |

---

> **Documento generado para el equipo de desarrollo de OASIS**  
> **Stack**: Next.js 16 App Router · Prisma · SQLite · JWT Auth  
> **Frontend**: React 19 · Framer Motion · Tailwind CSS · shadcn/ui
