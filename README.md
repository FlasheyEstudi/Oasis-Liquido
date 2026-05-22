```text
  ██████╗    █████╗     ██████╗    ██╗    ██████╗ 
 ██╔═══██╗  ██╔══██╗   ██╔════╝    ██║   ██╔════╝ 
 ██║   ██║  ███████║   ╚█████╗     ██║   ╚█████╗  
 ██║   ██║  ██╔══██║    ╚═══██╗    ██║    ╚═══██╗ 
 ╚██████╔╝  ██║  ██║   ██████╔╝    ██║   ██████╔╝ 
  ╚═════╝   ╚═╝  ╚═╝   ╚═════╝     ╚═╝   ╚═════╝  
```

<div align="center">

**Ecosistema Digital de Salud, Farmacias y Logística de Distribución**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.0%20%28App%20Router%29-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-GIS_Mapping-green?style=for-the-badge&logo=leaflet)](https://leafletjs.com/)

---

*Una plataforma empresarial moderna que interconecta Clínicas, Doctores, Farmacias, Cajeros, Repartidores y Pacientes en Nicaragua con soporte offline de vanguardia y notificaciones push inmediatas.*

</div>

---

## 🌟 Características Clave del Ecosistema

> [!IMPORTANT]
> Oasis Nicaragua no es solo un software de administración; es una suite completa diseñada para resolver los desafíos más críticos de la salud, distribución y facturación en Centroamérica.

### 🏥 1. Módulo Clínico Avanzado
* **Consultas Médicas en Tiempo Real:** Emisión de recetas digitales encriptadas con códigos de barras/QR de alta seguridad.
* **Control de Citas Centralizado:** Recepcionistas con agendas interactivas fluidas, gestión de pacientes y prevención inteligente de inasistencias (*no-shows*).
* **Firma Digital Segura:** Verificación y firma atómica de recetas por médicos certificados.

### 💊 2. Punto de Venta (POS) & Inventario de Farmacia
* **Facturación con Resiliencia Offline:** Service Workers e IndexedDB garantizan que los cajeros sigan vendiendo y buscando productos en el catálogo local incluso si el internet se corta por completo.
* **Motor de Split Payments:** Soporte robusto para cobros compuestos (tarjeta, transferencia y efectivo) con validación automática de montos y cálculo exacto de cambio.
* **Sincronización en Segundo Plano:** El gestor de sincronización local detecta el regreso de la conectividad y sube automáticamente las ventas offline de forma cronológica sin interrumpir el POS.

### 🚗 3. Logística de Distribución Freelance
* **Driver Dashboard Moderno:** Feed dinámico de órdenes pendientes para repartidores freelance con aceptación inmediata.
* **Geolocalización en Tiempo Real:** Seguimiento GPS continuo del conductor durante la ruta de entrega.
* **Entrega Segura por QR/Cédula:** Validación física segura mediante escaneo del QR digital del paciente o su identificación de cédula.

### 🔔 4. Notificaciones Push Contextuales (FCM)
* **Integración Nativa con Firebase:** Envío instantáneo de alertas a dispositivos móviles y escritorio al asignar un delivery, emitir una receta o completar una entrega.

---

## 📐 Arquitectura del Ecosistema

El siguiente diagrama detalla cómo se coordinan la PWA del cliente, el Service Worker local, los motores de sincronización y el backend central con base de datos en tiempo real:

```mermaid
graph TD
    %% Navegador Cliente PWA
    subgraph Browser["NAVEGADOR CLIENTE (PWA)"]
        UI["Next.js App Router (React UI)"]
        SW["Service Worker (Catálogo & Push)"]
        IDB[("IndexedDB Local Store")]
        SyncManager["Sync Manager (Auto-Sync)"]
    end

    %% Backend Central
    subgraph Backend["SERVIDOR CENTRAL (REST API)"]
        Auth["Middleware Roles (JWT Cookies)"]
        Routes["App Router Controllers (NextJS)"]
        Analytics["Analytics & Reporting Service"]
    end

    %% Capa de Datos
    subgraph Database["CAPA DE DATOS"]
        Prisma["Prisma ORM Client"]
        DB[(PostgreSQL / SQLite DB)]
    end

    %% Flujos de Conexión
    UI <--> IDB
    UI -->|Factura / Venta| SW
    SW <-->|Sincronización| SyncManager
    SyncManager -->|REST API Requests| Auth
    Auth --> Routes
    Routes --> Analytics
    Routes --> Prisma
    Prisma --> DB
    
    %% Alertas FCM
    FCM["Firebase Cloud Messaging (FCM)"] -->|Push Notifications| SW
    Routes -->|Despacha Alerta| FCM
```

---

## 👥 Matriz de Roles y Permisos

| Rol | Icono | Propósito Principal | Capacidades Clave |
| :--- | :---: | :--- | :--- |
| **Super Admin** | 👑 | Control global del ecosistema y auditoría | Gestiona dueños de clínicas, farmacias, reportes avanzados y facturación. |
| **Owner Clínica** | 🏥 | Administración de centros médicos | Invita doctores, recepcionistas, supervisa recetas emitidas y cobros. |
| **Owner Farmacia**| 💊 | Control logístico y de stock | Controla inventarios de medicamentos, invita cajeros, repartidores y asigna turnos. |
| **Doctor** | 🩺 | Consulta y emisión clínica | Escribe recetas digitales seguras, gestiona historial del paciente y citas virtuales. |
| **Recepcionista**| 📝 | Control de flujos físicos | Asigna turnos, crea citas en agenda y valida registros de pacientes nuevos. |
| **Cajero (POS)** | 🛒 | Punto de Venta | Factura de forma offline/online, valida pagos compuestos y egresos de stock. |
| **Repartidor** | 🛵 | Logística de última milla | Recibe pedidos, reporta GPS en vivo y valida entregas mediante QR. |
| **Paciente** | 👤 | Beneficiario final | Solicita consultas, visualiza recetas activas por código QR y rastrea entregas. |

---

## 🛠️ Stack Tecnológico Premium

### Frontend (PWA)
* **Next.js 15 & React 19:** Renderizado híbrido de alta velocidad, componentes modulares con TypeScript.
* **Framer Motion:** Animaciones fluidas de microinteracciones, transiciones fluidas de glassmorphic cards.
* **Leaflet & OSM:** Mapeo interactivo ligero de departamentos de Nicaragua con cálculo de rutas de distribución.
* **IndexedDB & Service Workers:** Persistencia local robusta para resiliencia offline.

### Backend (REST API)
* **Next.js Route Handlers:** Controladores ligeros optimizados para microservicios y respuestas instantáneas.
* **Prisma ORM:** Consultas de alto rendimiento con tipado estático seguro.
* **Zod:** Validación robusta en el borde de esquemas y payloads JSON.
* **FCM Admin SDK:** Despacho nativo de notificaciones.

---

## 🚀 Guía de Instalación y Despliegue Rápido

> [!TIP]
> Asegúrate de contar con Node.js v18+ y un motor de base de datos PostgreSQL activo (o SQLite configurado en Prisma).

### Paso 1: Levantar el Backend
```bash
cd Backend
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Generar cliente y migrar base de datos
npx prisma generate
npx prisma db push

# Iniciar servidor de desarrollo (Puerto 8000 por defecto)
npm run dev
```

### Paso 2: Levantar el Frontend
```bash
cd ../Frontend
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local

# Iniciar servidor de desarrollo (Puerto 3000 por defecto)
npm run dev
```

---

## 🔑 Configuración de Variables de Entorno (.env)

### Backend (`Backend/.env`)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/oasis_liquida?schema=public"
JWT_SECRET="secreto_atómico_firmas_jwt"
JWT_REFRESH_SECRET="secreto_atómico_refresh_jwt"

# Firebase Cloud Messaging Credentials
FIREBASE_PROJECT_ID="oasis-nicaragua"
FIREBASE_CLIENT_EMAIL="tu-servicio-cuenta@oasis-nicaragua.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nCLAVE_PRIVADA\n-----END PRIVATE KEY-----"
```

### Frontend (`Frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"

# Firebase Client SDK Credentials
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyA..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="oasis-nicaragua.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="oasis-nicaragua"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="oasis-nicaragua.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef0123"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="B..."
```

---

## 🏁 Estado de Módulos & Readiness

| Módulo | Estado | Submódulos Completados |
| :--- | :---: | :--- |
| **Core Auth & Roles** | ✅ 100% | Firma JWT Segura, Middleware en el borde, Refresh token robusto. |
| **Farmacia & POS** | ✅ 100% | Split Payments en backend, catálogo unificado, control de caja. |
| **POS Offline Engine** | ✅ 100% | IndexedDB local, Service Worker de activos, sincronización en bg cronológica. |
| **Driver & Delivery** | ✅ 100% | Drivers freelance feed, geolocalización, confirmación segura por código QR. |
| **Módulo de Reportes (Super Admin)** | ✅ 100% | Mapa de calor temporal, Leaflet bubble map de Nicaragua, KPI Gauges y Sankey diagram. |
| **Notificaciones Push** | ✅ 100% | Registro silencioso FCM en arranque de PWA, envío inmediato de eventos en tránsito. |

---

<div align="center">
Desarrollado con ❤️ para la salud y optimización logística en Centroamérica. 

**Oasis Nicaragua — © 2026 Todos los derechos reservados.**
</div>
