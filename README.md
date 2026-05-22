#   ____   _     ____   ___  ____    _   _  ___  ____    _    ____    _    ____ _   _    _     
#  / ___| / \   / ___| |_ _/ ___|  | \ | |/ _ \/ ___|  / \  |  _ \  / \  / ___| | | |  / \    
# | |  _ / _ \  \___ \  | |\___ \  |  \| | | | \___ \ / _ \ | |_) |/ _ \| |  _| | | | / _ \   
# | |_| / ___ \  ___) | | | ___) | | |\  | |_| |___) / ___ \|  _ < / ___ \ |_| | |_| |/ ___ \  
#  \____/_/   \_\____/ |___|____/  |_| \_|\___/|____/_/   \_\_| \_/_/   \_\____|\___//_/   \_\ 
#                                                                                              

> **Sistema Corporativo Integral de Salud, Farmacia y Delivery Clínico con Resiliencia Offline y Notificaciones en Tiempo Real.**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Platform Version](https://img.shields.io/badge/version-0.2.0-orange.svg)]()
[![Framework](https://img.shields.io/badge/Next.js-15-black.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)]()

---

## 📋 Descripción del Proyecto
**Oasis Nicaragua** es una plataforma tecnológica empresarial avanzada de salud integrada que conecta de manera bidireccional clínicas, médicos, farmacias, repartidores y pacientes. El ecosistema resuelve los siguientes problemas principales de la gestión médica y de distribución en Nicaragua:

1. **Resiliencia en Puntos de Venta (POS):** Operación ininterrumpida de facturación de medicamentos en sucursales con fallos de internet gracias a sincronización de datos con IndexedDB y Service Workers.
2. **Trazabilidad en Split Payments:** Validación transaccional de pagos compuestos (efectivo + tarjeta + transferencias) calculando el cambio correcto y controlando de forma segura la cobertura total de la venta.
3. **Flujo de Invitación Atómica:** Registro corporativo altamente seguro basado en invitaciones encriptadas y de un solo uso enviadas por correo electrónico para reclutamiento de trabajadores.
4. **Logística de Entrega Eficiente:** Asignación inmediata y seguimiento de conductores para entrega a domicilio de medicamentos de forma directa y rastreable.
5. **Comunicación Instantánea:** Sistema integrado de notificaciones push de nivel nativo para informar sobre confirmación de entregas y asignación de pedidos en tiempo real.

---

## 🏗️ Estructura del Proyecto
```bash
oasis-nicaragua/
├── Backend/
│   ├── prisma/
│   │   └── schema.prisma        # Modelo de Datos (PostgreSQL)
│   ├── src/
│   │   ├── app/api/v1/          # Controladores organizados en el App Router
│   │   ├── lib/
│   │   │   ├── auth/            # Middleware de Seguridad y Roles
│   │   │   ├── services/        # Servicios de Negocio (Sales, Delivery, FCM)
│   │   │   └── validators/      # Esquemas de Validación con Zod
│   │   └── types/               # Tipos TypeScript Globales
│   └── package.json
└── Frontend/
    ├── public/
    │   ├── sw.js                # Service Worker para almacenamiento en caché y Push
    │   └── manifest.json        # Configuración de Progressive Web App (PWA)
    ├── src/
    │   ├── api/                 # Clientes HTTP (Axios) para consumo de Backend
    │   ├── app/                 # Next.js App Router (Páginas del POS y Paciente)
    │   ├── components/
    │   │   ├── pharmacy/        # POS y Módulos de Farmacia
    │   │   └── pwa-initializer.tsx # Startup y Auto-Sync FCM silencioso
    │   ├── lib/
    │   │   ├── offline-store.ts # Repositorio IndexedDB local
    │   │   ├── sync-manager.ts  # Gestor de resincronización de ventas
    │   │   ├── firebase-config.ts # Configuración de Cliente Firebase
    │   │   └── push-manager.ts  # Permisos y Token FCM Manager
    │   └── contexts/            # Contextos globales de React
    └── package.json
```

---

## 📐 Diagrama de Arquitectura

```text
                  +----------------------------------------------+
                  |               NAVEGADOR CLIENTE              |
                  |                                              |
                  |     +-----------+            +-----------+   |
                  |     |  Next.js  |<---------->|  IndexedDB|   |
                  |     |  PWA UI   | (Factura)  |  Catalog  |   |
                  |     +-----------+            +-----------+   |
                  |           ^                        ^         |
                  |           | (Intercepta)           | (Sync)  |
                  |           v                        v         |
                  |     +-----------+            +-----------+   |
                  |     |  Service  |<---------->|   Sync    |   |
                  |     |  Worker   | (Assets)   |  Manager  |   |
                  |     +-----------+            +-----------+   |
                  +-----------^------------------------^---------+
                              |                        |
                   Push Alert |                        | API HTTP REST
                              |                        v
                  +-----------+------------------------+---------+
                  |                 BACKEND API                  |
                  |                                              |
                  |  +-------------+            +-------------+  |
                  |  |  NextJS App |<---------->|  Middleware |  |
                  |  |   Router    | (Auth JWT) |    Roles    |  |
                  |  +------+------+            +-------------+  |
                  |         |                                    |
                  |         | (Prisma Client)                    |
                  +---------+------------------------------------+
                            |
                            v
                  +---------+---------+
                  |   PostgreSQL DB   |
                  +-------------------+
```

---

## 👥 Roles y Permisos

| Rol | Responsabilidades | Puede Crear / Gestionar |
|-----|-------------------|-------------------------|
| **Admin** | Administración de clínicas, farmacias y auditoría total. | Dueños de Clínicas y Dueños de Farmacias. |
| **Clinic Owner** | Gestión administrativa y comercial de clínicas. | Doctores, Recepcionistas e Invitaciones de Clínica. |
| **Pharmacy Owner** | Gestión administrativa e inventarios de farmacias. | Cajeros, Repartidores e Invitaciones de Sucursal. |
| **Doctor** | Consulta médica digital y emisión de recetas. | Recetas Médicas, Citas y Diagnósticos. |
| **Receptionist** | Control de agendas y registro de citas físicas. | Citas Médicas y Fichas de Paciente. |
| **Cashier** | Venta al público en mostrador (Online / Offline). | Facturas, Ventas y Split Payments. |
| **Delivery Driver** | Logística y entrega de medicamentos. | Actualización de Ubicación GPS y Estado de Entrega. |
| **Patient** | Pacientes y beneficiarios de la plataforma. | Compra de medicamentos y Rastrear Entregas. |

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología | Razón de Elección |
|-----------|------------|-------------------|
| **Backend** | **Next.js API Routes** | Enrutamiento e integración unificada del lado del servidor. |
| **Frontend** | **Next.js App Router (React 19)** | Carga ultrarrápida (SSR), renderizado híbrido y modularidad premium. |
| **Database** | **PostgreSQL** | Base de datos relacional de grado empresarial para transacciones críticas. |
| **ORM** | **Prisma** | Agilidad en consultas con tipado TypeScript seguro e instantáneo. |
| **Estilos** | **Vanilla CSS + Tailwind** | Diseño ultra premium optimizado con Glassmorphic aesthetics. |
| **Offline** | **IndexedDB (IDB) + SW** | Base de datos interna de navegador de alta velocidad y service workers eficientes. |
| **Push** | **Firebase Admin + FCM SDK** | Despacho confiable de alertas y notificaciones nativas en segundo plano. |

---

## 🚀 Instalación y Configuración

Sigue estos sencillos pasos para levantar el entorno de Oasis Nicaragua en tu máquina local:

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tuusuario/oasis-nicaragua.git
cd oasis-nicaragua
```

### 2. Configurar el Backend
```bash
# Navegar al directorio de Backend
cd Backend

# Configurar variables de entorno
cp .env.example .env

# Instalar dependencias e inicializar base de datos
npm install
npx prisma generate
npx prisma db push

# Levantar el Backend (Puerto por defecto: 8000)
npm run dev
```

### 3. Configurar el Frontend (En otra terminal)
```bash
# Navegar al directorio de Frontend
cd ../Frontend

# Configurar variables de entorno
cp .env.local.example .env.local

# Instalar dependencias
npm install

# Levantar el servidor de desarrollo del Frontend (Puerto por defecto: 3000)
npm run dev
```

---

## 🔑 Variables de Entorno

### Backend (`Backend/.env`)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/oasis_liquida?schema=public"
JWT_SECRET="un_secreto_super_seguro_para_firmar_los_tokens_jwt"
JWT_REFRESH_SECRET="otro_secreto_seguro_para_los_refresh_tokens"

# Firebase Cloud Messaging
FIREBASE_PROJECT_ID="oasis-nicaragua"
FIREBASE_CLIENT_EMAIL="tu-servicio-cuenta@oasis-nicaragua.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_clave_privada_aqui\n-----END PRIVATE KEY-----"
```

### Frontend (`Frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"

# Firebase Client SDK Credentials (FCM Push)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyA..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="oasis-nicaragua.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="oasis-nicaragua"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="oasis-nicaragua.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef0123"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="B..."
```

---

## 🔗 Endpoints Principales (API v1)

| Método | Endpoint | Descripción | Roles Permitidos |
|--------|----------|-------------|------------------|
| **POST** | `/api/v1/auth/login` | Autenticación de usuario con cookies seguras | Todos |
| **POST** | `/api/v1/auth/register` | Registro inicial de pacientes | Todos |
| **POST** | `/api/v1/users/me/fcm-token` | Registra/Actualiza token FCM en el perfil | Todos |
| **DELETE** | `/api/v1/users/me/fcm-token` | Elimina el token FCM registrado del perfil | Todos |
| **POST** | `/api/v1/pharmacies/:id/sales` | Registra una venta en el POS (Soporta Split) | Cashier, Pharmacy Owner |
| **GET** | `/api/v1/pharmacies/:id/inventory` | Obtener inventario de medicamentos | Cashier, Pharmacy Owner |
| **POST** | `/api/v1/pharmacies/:id/cashiers/invite` | Envia invitación por correo a cajero | Pharmacy Owner |
| **PUT** | `/api/v1/delivery/status` | Actualizar estado del delivery (dispara Push) | Delivery Driver, Pharmacy Owner |

---

## 🚦 Estado de los Módulos del Proyecto

| Módulo | Estado | Notas |
|--------|--------|-------|
| **Autenticación (JWT + Cookies)** | ✅ Completado | Seguridad de token atómico y roles. |
| **Punto de Venta POS (Farmacia)** | ✅ Completado | Integración de catálogo, caja e inventario. |
| **Validación de Split Payments** | ✅ Completado | Validaciones de saldo, cambio y auditorías. |
| **POS Offline (IndexedDB + Sync)** | ✅ Completado | Sincronización en segundo plano e inventario local. |
| **Notificaciones Push (FCM)** | ✅ Completado | Soporte multiplataforma y alertas contextuales. |
| **Módulo Clínico (Doctores/Citas)** | ⚠️ Parcial | Endpoints completos; pantallas del doctor en refinamiento. |
| **Rutas y Trazabilidad de Repartidor** | ⚠️ Parcial | Tracking GPS del repartidor en progreso. |

---

## 🗺️ Roadmap de Oasis Nicaragua

- [x] **Fase 1:** Arquitectura base del Backend e integración Prisma PostgreSQL.
- [x] **Fase 2:** Flujo completo de registro seguro de trabajadores mediante invitación atómica.
- [x] **Fase 3:** POS offline (IndexedDB), Split Payments en backend y Push notifications FCM.
- [ ] **Fase 4:** Consolidación de tracking GPS en tiempo real de repartidores usando MapLibre/OSRM.
- [ ] **Fase 5:** Firma digital PIN en recetas médicas emitida por doctores certificados.

---

## 🤝 Cómo Contribuir

1. Realiza un **Fork** de este repositorio.
2. Crea tu rama de características: `git checkout -b feature/nueva-funcionalidad`
3. Guarda tus cambios: `git commit -m 'feat: añadir nueva funcionalidad a Oasis'`
4. Envía tu rama al repositorio remoto: `git push origin feature/nueva-funcionalidad`
5. Abre un **Pull Request** para revisión y mezcla.

---

## 📄 Licencia
Este proyecto es software privado protegido. Distribuido bajo la Licencia **MIT**.

© 2026 Oasis Nicaragua - Todos los derechos reservados.
