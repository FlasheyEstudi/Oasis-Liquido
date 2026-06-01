# 🌿 OASIS NICARAGUA

## Ecosistema Digital de Salud, Farmacias y Logística de Distribución

<div align="center">

```
 ██████╗  █████╗  ███████╗██╗███████╗
██╔═══██╗██╔══██╗██╔════╝██║██╔════╝
██║   ██║███████║███████╗██║███████╗
██║   ██║██╔══██║╚════██║██║╚════██║
╚██████╔╝██║  ██║███████║██║███████║
 ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝╚══════╝
```

### *Tu refugio de salud digital*

[![Next.js][next-badge]][next-url]
[![React][react-badge]][react-url]
[![TypeScript][ts-badge]][ts-url]
[![Prisma][prisma-badge]][prisma-url]
[![Tailwind CSS][tailwind-badge]][tailwind-url]
[![PostgreSQL][postgres-badge]][postgres-url]
[![Supabase][supabase-badge]][supabase-url]
[![Firebase][firebase-badge]][firebase-url]
[![Leaflet][leaflet-badge]][leaflet-url]
[![License][license-badge]][license-url]

*Una suite digital premium que interconecta Clínicas, Médicos, Farmacias, Cajeros, Repartidores y Pacientes en Nicaragua con soporte offline resiliente, analíticas avanzadas y notificaciones push.*

</div>

---

## 📋 Tabla de Contenidos

- [🚀 Mejoras Recientes e Hitos de Ingeniería](#-mejoras-recientes-e-hitos-de-ingeniería)
- [🔍 Pautas de Auditoría Forense y Logs de Seguridad](#-pautas-de-auditoría-forense-y-logs-de-seguridad)
- [📡 Protocolo de Sincronización y Motor Offline](#-protocolo-de-sincronización-y-motor-offline)
- [🌟 Características Clave](#-características-clave)
- [📐 Arquitectura del Sistema](#-arquitectura-del-sistema)
- [👥 Roles y Permisos](#-roles-y-permisos)
- [🛠️ Stack Tecnológico](#-stack-tecnológico)
- [🚀 Instalación Rápida](#-instalación-rápida)
- [🔧 Configuración](#-configuración)
- [📊 Estado de Módulos](#-estado-de-módulos)
- [📋 Planes y Objetivos Estratégicos](#-planes-y-objetivos-estratégicos)
- [🔮 Visión a Futuro](#-visión-a-futuro)

---

## 🚀 Mejoras Recientes e Hitos de Ingeniería (Mayo-Junio 2026)

Durante el ciclo reciente de QA y optimización de producción, implementamos las siguientes mejoras clave de estabilidad y seguridad:

### 🛡️ **Seguridad Multi-Tenant Sellada (Rol Farmacia)**
* Encontramos y parchamos una filtración lógica en la lista de despachos. Ahora, el backend consulta dinámicamente las farmacias propiedad del `ownerId` de sesión (`pharmacy_admin`) y restringe los resultados de forma estricta: `where.pharmacyId = { in: pharmacyIds }`. **Cero fugas de datos entre locales competidores.**

### 🔄 **Motor de Serialización Global (CamelCase $\rightarrow$ SnakeCase)**
* Implementamos el mapeador síncrono `mapDeliveryOrder` en el backend. Convierte de forma atómica y transparente las estructuras de la base de datos PostgreSQL (camelCase) al formato JSON snake_case que espera el frontend, poblando de inmediato las propiedades `delivery_address`, `order_date` y el desglose de medicamentos (`items`). **UI libre de tarjetas vacías y precios en cero.**

### 📡 **Sincronización Directa de Asignación y Notificaciones**
* Corregimos la consulta SQL de pedidos asignados del repartidor (`GET /api/v1/delivery/orders/assigned`). Ahora incluye el estado `"assigned"` y realiza la precarga relacional de los ítems de venta. La app del courier se actualiza en menos de 4 segundos a través de React Query e integra notificaciones push de Firebase en tiempo real.

### 📱 **Resiliencia GPS en WebViews Móviles**
* Eliminamos los callbacks asíncronos nativos en la geolocalización del móvil (causantes de crashes del hilo principal en navegadores embebidos de Android y iOS) y los sustituivos por una envoltura de Promesas estándar de JavaScript. El SOS satelital y el tracking en vivo operan con absoluta fluidez háptica.

---

## 🔍 Pautas de Auditoría Forense y Logs de Seguridad

Oasis implementa un esquema estricto de **trazabilidad de operaciones críticas** para garantizar el cumplimiento normativo (compliance) y evitar fraudes en el despacho de recetas y caja POS:

1. **Captura Atómica de Eventos:** Cada mutación en la base de datos (creación de recetas, despacho de ventas, cobros compuestos, asignación de courier) dispara una llamada síncrona al servicio de auditoría `createAuditLog`.
2. **Metadatos del Actor:** Los logs registran de forma obligatoria el ID del usuario ejecutor, dirección IP, tipo de acción (`create`, `update`, `delete`, `auth`), agente de usuario (navegador o WebView) y el payload de cambios detallados en formato JSON stringify.
3. **Inmutabilidad:** Las entradas de auditoría en la tabla `audit_logs` son de solo inserción (*insert-only*). No existen controladores ni endpoints que permitan su modificación o eliminación, garantizando registros periciales 100% confiables en caso de disputas.

---

## 📡 Protocolo de Sincronización y Motor Offline

Para dar soporte en zonas rurales de Nicaragua con conectividad inestable o nula, Oasis implementa una arquitectura híbrida de resiliencia de datos:

```
[ Cajero POS ] ── (¿Conexión?) ──► [ Sí ] ──► Servidor PostgreSQL (Venta Inmediata)
       │
       └──► [ No ] ──► Service Worker ──► IndexedDB (Cola de Ventas Pendientes)
                             ▲
                             └─► (Connectivity Restored Event) ──► SyncManager Upload
```

* **IndexedDB & Service Workers:** Las transacciones iniciadas sin internet son capturadas por el Service Worker e indexadas localmente con identificadores únicos temporales.
* **SyncManager Inteligente:** Al detectar el evento de ventana `'online'`, el gestor activa el barrido de cola en segundo plano. 
* **Discriminador de Errores (Red vs Validación):** 
  * Si el servidor rechaza una venta por conflicto lógico (ej. error 400 por falta de existencias de lote *INSUFFICIENT_STOCK*), el gestor la marca localmente como fallida para que el cajero la rectifique.
  * Si la falla es por corte de red o timeout, el gestor conserva la orden en cola y detiene la secuencia para no agotar los recursos del cliente, reanudando de forma segura en la próxima ventana activa.

---

## 🌟 Características Clave

> [!IMPORTANT]
> **Oasis** ha sido diseñado con resiliencia offline, modo adulto mayor y analíticas en tiempo real para el ecosistema de salud nicaragüense.

### 🏥 **Módulo Clínico Avanzado**

| Característica | Descripción |
|----------------|-------------|
| **Consultas Médicas** | Interfaz sofisticada para emisión y firma digital de recetas con QR de alta seguridad |
| **Control de Citas** | Recepcionistas con agendas interactivas y prevención de inasistencias |
| **Firma Digital** | Verificación y firma atómica de recetas por médicos certificados |
| **Modo Adulto Mayor** | Interfaz adaptada con fuentes grandes, alto contraste y botones ampliados |

### 💊 **Punto de Venta (POS) & Inventario**

| Característica | Descripción |
|----------------|-------------|
| **Resiliencia Offline** | Service Workers e IndexedDB garantizan operación continua sin internet |
| **Split Payments** | Soporte robusto para cobros compuestos (tarjeta, transferencia, efectivo) |
| **Sincronización BG** | Subida automática de ventas offline al recuperar conectividad |
| **Kardex Digital** | Trazabilidad completa de movimientos de inventario en tiempo real |

### 🚗 **Logística de Distribución Freelance**

| Característica | Descripción |
|----------------|-------------|
| **Driver Dashboard** | Feed dinámico de órdenes pendientes con aceptación inmediata |
| **Geolocalización en Vivo** | Seguimiento GPS continuo durante la ruta de entrega |
| **Entrega Segura** | Validación mediante QR digital o identificación por cédula |
| **Rutas Optimizadas** | Cálculo automático usando OpenStreetMap |

### 📊 **Panel de Control Premium**

| Característica | Descripción |
|----------------|-------------|
| **Mapa de Calor Temporal** | Visualización interactiva de ingresos por período |
| **Distribución Geográfica** | Mapa de Nicaragua con burbujas proporcionales de ventas |
| **Ranking por Entidad** | Comparativa dinámica de ingresos por clínica/farmacia |
| **Sankey Flow Diagram** | Embudo transaccional desde consulta hasta entrega |

---

## 📐 Arquitectura del Sistema

### Diagrama de Arquitectura General

```mermaid
graph TB
    subgraph Client["🌐 CLIENTE (PWA)"]
        UI["Next.js App Router<br/>React 19 UI"]
        SW["Service Worker<br/>Cache + Push"]
        IDB[("IndexedDB<br/>Local Storage")]
        Sync["Sync Manager<br/>Auto-sync"]
    end

    subgraph Gateway["🔒 GATEWAY & SEGURIDAD"]
        Auth["JWT Middleware<br/>Verificación"]
        RBAC["RBAC<br/>Control de Roles"]
        RateLimit["Rate Limiter<br/>100 req/min"]
    end

    subgraph Backend["⚙️ BACKEND (API)"]
        Routes["API Routes<br/>Next.js Handlers"]
        Services["Services Layer<br/>Business Logic"]
        Queue["Job Queue<br/>Background Tasks"]
    end

    subgraph External["🔌 SERVICIOS EXTERNOS"]
        FCM["Firebase Cloud Messaging<br/>Push Notifications"]
        Maps["OpenStreetMap + Leaflet<br/>Geolocalización + Rutas"]
        Storage["Supabase Storage<br/>Documentos + Imágenes"]
        WhatsApp["WhatsApp Business<br/>Alertas + Teleconsulta"]
    end

    subgraph Data["💾 CAPA DE DATOS"]
        Prisma["Prisma ORM<br/>Type-Safe Queries"]
        PostgreSQL[("PostgreSQL / Supabase<br/>Base de Datos Principal")]
        Redis[("Redis<br/>Caché + Sesiones")]
    end

    UI --> SW
    UI --> IDB
    UI --> Sync
    Sync --> Auth
    Auth --> RBAC
    RBAC --> RateLimit
    RateLimit --> Routes
    Routes --> Services
    Services --> Queue
    Services --> Prisma
    Prisma --> PostgreSQL
    Services --> Redis
    Services --> FCM
    Services --> Maps
    Services --> Storage
    Services --> WhatsApp

    classDef client fill:#0D9488,stroke:#0F766E,color:#fff
    classDef gateway fill:#1E40AF,stroke:#1E3A8A,color:#fff
    classDef backend fill:#EA580C,stroke:#C2410C,color:#fff
    classDef external fill:#7C3AED,stroke:#6D28D9,color:#fff
    classDef data fill:#64748B,stroke:#475569,color:#fff
    
    class UI,SW,IDB,Sync client
    class Auth,RBAC,RateLimit gateway
    class Routes,Services,Queue backend
    class FCM,Maps,Storage,WhatsApp external
    class Prisma,PostgreSQL,Redis data
```

### Diagrama de Despliegue

```mermaid
graph TB
    subgraph Development["🖥️ DESARROLLO"]
        Local["Localhost:3000<br/>Next.js Dev Server"]
        BackendDev["Localhost:8000<br/>API Dev Server"]
        LocalDB[("PostgreSQL<br/>Local DB")]
    end

    subgraph Production["☁️ PRODUCCIÓN"]
        Vercel["Vercel Edge Network<br/>Frontend + API Routes"]
        Supabase["Supabase Cloud<br/>PostgreSQL + Storage"]
        Redis["Redis Cloud<br/>Caché + Sesiones"]
    end

    subgraph External["🔌 EXTERNAL SERVICES"]
        FCM["Firebase FCM"]
        OSM["OpenStreetMap<br/>Tile Servers"]
        WhatsApp["WhatsApp Business API"]
    end

    subgraph Client["📱 DEVICES"]
        Mobile["React Native App<br/>iOS + Android"]
        Web["PWA Browser<br/>Chrome + Safari"]
    end

    Client -->|HTTPS| Vercel
    Client -->|HTTPS| Supabase
    Vercel --> Supabase
    Vercel --> Redis
    Vercel --> FCM
    Vercel --> OSM
    Vercel --> WhatsApp
    Local --> BackendDev
    BackendDev --> LocalDB
```

### Diagrama de Datos (Entity Relationship)

```mermaid
erDiagram
    User ||--o{ PharmacyStaff : "trabaja en"
    User ||--o{ DoctorProfile : "es"
    User ||--o{ PatientProfile : "es"
    User ||--o{ Sale : "realiza"
    User ||--o{ Prescription : "recibe"
    User ||--o{ FamilyRelationship : "cuida a"
    
    Pharmacy ||--o{ PharmacyStaff : "tiene"
    Pharmacy ||--o{ Inventory : "contiene"
    Pharmacy ||--o{ Sale : "genera"
    Pharmacy ||--o{ DeliveryOrder : "envía"
    Pharmacy ||--o{ PharmacyDocument : "documentos"
    
    Clinic ||--o{ DoctorProfile : "emplea"
    Clinic ||--o{ Appointment : "recibe"
    Clinic ||--o{ ClinicDocument : "documentos"
    
    Medicine ||--o{ Inventory : "almacenado en"
    Medicine ||--o{ PrescriptionLine : "prescrito en"
    Medicine ||--o{ SaleItem : "vendido en"
    
    Prescription ||--o{ PrescriptionLine : "contiene"
    Prescription ||--o{ Sale : "genera"
    
    Sale ||--o{ SaleItem : "incluye"
    Sale ||--o{ DeliveryOrder : "tiene"
    
    DeliveryOrder ||--o{ DeliveryTracking : "registra"
```

### Diagrama de Estados (Delivery Order)

```mermaid
stateDiagram-v2
    [*] --> Pending: Cliente solicita delivery
    Pending --> Assigned: Farmacia asigna motorista
    Assigned --> Accepted: Repartidor acepta misión
    Accepted --> PickedUp: Repartidor recoge en farmacia
    PickedUp --> InTransit: Repartidor en camino
    InTransit --> Delivered: Entregado al paciente
    InTransit --> Failed: Problema en entrega
    Failed --> Pending: Reintentar / Volver a asignar
    Delivered --> [*]
    Accepted --> Cancelled: Cancelado por farmacia/cliente
    Assigned --> Cancelled
    Pending --> Cancelled
    Cancelled --> [*]
```

---

## 👥 Roles y Permisos

| Rol | Icono | Propósito Principal | Capacidades Clave |
|:---|:---:|:---|:---|
| **Super Admin** | 👑 | Control global del ecosistema y auditoría | Gestiona owners, reportes avanzados, facturación global |
| **Admin Clínica** | 🏥 | Administración de centros médicos | Invita doctores/recepcionistas, supervisa recetas y cobros |
| **Admin Farmacia** | 💊 | Control logístico y de stock | Controla inventarios, invita cajeros/repartidores, asigna turnos |
| **Doctor** | 🩺 | Consulta y emisión clínica | Recetas digitales QR, historial del paciente, teleconsulta |
| **Recepcionista** | 📝 | Control de flujos físicos | Asigna turnos, agenda citas, valida registros |
| **Cajero POS** | 🛒 | Punto de Venta | Factura offline/online, valida pagos compuestos |
| **Repartidor** | 🛵 | Logística de última milla | Recibe pedidos, reporta GPS, valida entregas con QR |
| **Paciente** | 👤 | Beneficiario final | Solicita consultas, visualiza recetas QR, rastrea entregas |

---

## 🛠️ Stack Tecnológico

| Categoría | Tecnologías | Versión | Propósito |
|:---|:---|:---:|:---|
| **Frontend** | Next.js, React 19, TypeScript | 15.x | PWA híbrida con App Router |
| **Estilos** | Tailwind CSS, Framer Motion | 4.x | UI moderna con glassmorphism |
| **Backend** | Next.js API Routes, Prisma, Zod | 15.x | API REST tipada y segura |
| **Base de Datos** | PostgreSQL, Supabase | 15.x | Datos relacionales + Auth |
| **Caché Local** | IndexedDB, Service Workers | N/A | Resiliencia offline |
| **Mapas** | Leaflet, OpenStreetMap, OSRM | 1.9.x | Geolocalización y rutas |
| **Notificaciones** | Firebase Cloud Messaging | 10.x | Push nativas |
| **Autenticación** | JWT, bcrypt, Firebase Auth | 8.x | Sesiones seguras |

---

## 🚀 Instalación Rápida

> [!TIP]
> Asegúrate de tener **Node.js v18+** y **PostgreSQL** instalados (o usa Supabase).

### 📦 Backend

```bash
# Clonar repositorio
git clone https://github.com/tuusuario/oasis-nicaragua.git
cd oasis-nicaragua/Backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Generar cliente Prisma y migrar DB
npx prisma generate
npx prisma db push

# Iniciar servidor de desarrollo
npm run dev
```

### 🎨 Frontend

```bash
# En otra terminal
cd ../Frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local

# Iniciar servidor de desarrollo
npm run dev
```

### 📱 Acceso

* **Frontend Web:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:8000/api/v1](http://localhost:8000/api/v1)
* **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 🔧 Configuración

### Backend (`.env`)

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/oasis"

# JWT Secrets
JWT_SECRET="tu_secreto_atomico_aqui"
JWT_REFRESH_SECRET="tu_secreto_refresh_aqui"

# Firebase Admin
FIREBASE_PROJECT_ID="oasis-nicaragua"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@oasis-nicaragua.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nCLAVE_PRIVADA\n-----END PRIVATE KEY-----"

# Server
PORT=8000
NODE_ENV=development
```

### Frontend (`.env.local`)

```env
# API
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyA..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="oasis-nicaragua.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="oasis-nicaragua"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="oasis-nicaragua.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef0123"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="B..."

# Mapas
NEXT_PUBLIC_MAPTILER_KEY=""
```

---

## 📊 Estado de Módulos

| Módulo | Estado | Completitud | Notas |
|:---|:---:|:---:|:---|
| **Core Auth & Roles** | ✅ | 100% | JWT, refresh tokens, middleware |
| **Gestión de Usuarios** | ✅ | 100% | CRUD completo con perfiles |
| **Módulo Clínica** | ✅ | 100% | Doctores, citas, recepcionistas |
| **Recetas Digitales** | ✅ | 100% | QR, firma digital, validación |
| **Farmacia & POS** | ✅ | 100% | Split payments, inventario FEFO |
| **POS Offline Engine** | ✅ | 100% | IndexedDB, sync automático |
| **Driver & Delivery** | ✅ | 100% | Feed freelance, geolocalización WebView |
| **Entrega Segura QR** | ✅ | 100% | Validación por QR/cédula |
| **Reportes Super Admin** | ✅ | 100% | Heatmaps, Sankey, rankings |
| **Notificaciones Push** | ✅ | 100% | FCM, multi-dispositivo |
| **Modo Adulto Mayor** | ✅ | 100% | Interfaz adaptativa |

---

## 📋 Planes y Objetivos Estratégicos

### Visión General

> **"Transformar el acceso a la salud en Nicaragua mediante una plataforma digital que conecte a todos los actores del ecosistema de salud, eliminando barreras geográficas y mejorando la adherencia a los tratamientos."**

---

### Plan Estratégico 2026 - 2028

```mermaid
flowchart LR
    subgraph P1["📌 PLAN 1: CONSOLIDACIÓN"]
        A1["Estabilización<br/>de plataforma"]
        A2["Expansión<br/>Managua"]
        A3["30 farmacias<br/>10 clínicas"]
    end

    subgraph P2["📌 PLAN 2: CRECIMIENTO"]
        B1["Expansión<br/>departamental"]
        B2["Integración<br/>MINSA"]
        B3["100 farmacias<br/>30 clínicas"]
    end

    subgraph P3["📌 PLAN 3: MADUREZ"]
        C1["Cobertura<br/>nacional"]
        C2["Alianzas<br/>estratégicas"]
        C3["500 farmacias<br/>100 clínicas"]
    end

    subgraph P4["📌 PLAN 4: EXPANSIÓN"]
        D1["Mercado<br/>Centroamérica"]
        D2["Franquicia<br/>social"]
        D3["1000+ farmacias<br/>Regional"]
    end

    P1 --> P2 --> P3 --> P4
```

---

## 🔮 Visión a Futuro

### Hoja de Ruta de Producto

```mermaid
gantt
    title Hoja de Ruta de Producto Oasis Nicaragua
    dateFormat YYYY-MM-DD
    
    section PLAN 1 (2026)
    MVP estabilizado           :2026-01-01, 90d
    POS offline completo       :2026-04-01, 60d
    Dashboard Super Admin      :2026-06-01, 60d
    Expansión Managua          :2026-08-01, 120d
    
    section PLAN 2 (2027)
    App móvil nativa           :2027-01-01, 90d
    Integración MINSA          :2027-04-01, 90d
    Telemedicina               :2027-07-01, 60d
    Expansión departamental    :2027-09-01, 120d
    
    section PLAN 3 (2028)
    IA predictiva stock        :2028-01-01, 120d
    Certificación ISO 27001    :2028-03-01, 90d
    Alianzas estratégicas      :2028-06-01, 90d
    Cobertura nacional         :2028-09-01, 120d
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor sigue estos pasos:

1. **Fork** el repositorio
2. Crea tu rama: `git checkout -b feature/amazing-feature`
3. **Commit** tus cambios: `git commit -m 'feat: add amazing feature'`
4. **Push** a la rama: `git push origin feature/amazing-feature`
5. Abre un **Pull Request**

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT** - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- **OpenStreetMap** por los datos cartográficos gratuitos.
- **Firebase** por las notificaciones push.
- **Supabase** por la infraestructura de base de datos.
- **Comunidad de Nicaragua** por las pruebas y retroalimentación.

---

<div align="center">

### *"Uniendo clínicas, farmacias y pacientes en un solo ecosistema inteligente"*

---

**Desarrollado con ❤️ para Nicaragua** · **© 2026 Oasis Nicaragua**

[📧 Contacto](mailto:info@oasisnicaragua.com) · [🐦 Twitter](https://twitter.com/oasisnicaragua) · [📱 Demo](https://demo.oasisnicaragua.com)

</div>

---

<!-- BADGES LINKS -->
[next-badge]: https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=nextdotjs
[next-url]: https://nextjs.org/
[react-badge]: https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react
[react-url]: https://react.dev/
[ts-badge]: https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript
[ts-url]: https://www.typescriptlang.org/
[prisma-badge]: https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma
[prisma-url]: https://www.prisma.io/
[tailwind-badge]: https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwindcss
[tailwind-url]: https://tailwindcss.com/
[postgres-badge]: https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql
[postgres-url]: https://www.postgresql.org/
[supabase-badge]: https://img.shields.io/badge/Supabase-Storage-3FCF8E?style=for-the-badge&logo=supabase
[supabase-url]: https://supabase.com/
[firebase-badge]: https://img.shields.io/badge/Firebase-FCM-FFCA28?style=for-the-badge&logo=firebase
[firebase-url]: https://firebase.google.com/
[leaflet-badge]: https://img.shields.io/badge/Leaflet-Maps-199900?style=for-the-badge&logo=leaflet
[leaflet-url]: https://leafletjs.com/
[license-badge]: https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge
[license-url]: https://opensource.org/licenses/MIT

---

<div align="center">
  
**⭐ Si te gusta el proyecto, ¡no olvides darle una estrella en GitHub! ⭐**

</div>