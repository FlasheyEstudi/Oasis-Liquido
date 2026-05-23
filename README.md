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

- [🌟 Características Clave](#-características-clave)
- [📐 Arquitectura del Sistema](#-arquitectura-del-sistema)
- [👥 Roles y Permisos](#-roles-y-permisos)
- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [🚀 Instalación Rápida](#-instalación-rápida)
- [🔧 Configuración](#-configuración)
- [📊 Estado de Módulos](#-estado-de-módulos)
- [📋 Planes y Objetivos Estratégicos](#-planes-y-objetivos-estratégicos)
- [🔮 Visión a Futuro](#-visión-a-futuro)

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
| **Kardex Digital** | Trazabilidad completa de movimientos de inventario |

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
    Pending --> ReadyForPickup: Farmacia prepara pedido
    ReadyForPickup --> Accepted: Repartidor acepta
    Accepted --> PickedUp: Repartidor recoge en farmacia
    PickedUp --> InTransit: Repartidor en camino
    InTransit --> Delivered: Entregado al paciente
    InTransit --> Failed: Problema en entrega
    Failed --> ReadyForPickup: Reintentar
    Delivered --> [*]
    Accepted --> Cancelled: Cancelado por farmacia/cliente
    ReadyForPickup --> Cancelled
    Pending --> Cancelled
    Cancelled --> [*]
```

### Diagrama de Secuencia (Receta Digital)

```mermaid
sequenceDiagram
    participant Doctor as 👨‍⚕️ Doctor
    participant API as 🖥️ Backend API
    participant Patient as 🧘 Paciente
    participant Pharmacy as 💊 Farmacia
    participant FCM as 🔔 Firebase

    Doctor->>API: 1. POST /prescriptions
    API->>API: 2. Validar doctor
    API->>API: 3. Generar QR único
    API->>API: 4. Firma digital
    API-->>Doctor: 5. Receta creada + QR
    Doctor->>Patient: 6. Comparte QR (app/WhatsApp)
    
    Patient->>Pharmacy: 7. Presenta QR
    Pharmacy->>API: 8. GET /prescriptions/scan/:qr
    API->>API: 9. Validar receta (expiración, estado)
    alt Receta válida
        API-->>Pharmacy: 10. Datos de receta
        Pharmacy->>API: 11. POST /sales (venta)
        API->>API: 12. Descontar inventario
        API->>API: 13. Marcar receta como surtida
        API->>FCM: 14. Notificar al paciente
        FCM-->>Patient: 15. "Receta surtida ✅"
    else Receta inválida
        API-->>Pharmacy: 10. Error (expirada/inválida)
        Pharmacy-->>Patient: 11. Mensaje de error
    end
```

### Diagrama de Flujo (Autenticación)

```mermaid
flowchart TD
    Start[Usuario abre app] --> HasAccount{¿Tiene cuenta?}
    
    HasAccount -->|No| SelectRole[Selecciona rol]
    SelectRole --> InputData[Ingresa email, nombre, contraseña]
    InputData --> UploadDocs[Sube documentos legales si aplica]
    UploadDocs --> VerifyEmail[Verifica email con código]
    VerifyEmail --> AdminApprove{Admin aprueba?}
    AdminApprove -->|Sí| AccountCreated[Cuenta creada ✅]
    AdminApprove -->|No| Rejected[Cuenta rechazada ❌]
    
    HasAccount -->|Sí| Login[Ingresa credenciales]
    Login --> ValidateCreds{¿Credenciales válidas?}
    ValidateCreds -->|Sí| GenerateJWT[Genera JWT + Refresh Token]
    GenerateJWT --> Dashboard[Accede al dashboard]
    ValidateCreds -->|No| ShowError[Error de autenticación]
    ShowError --> Login
    
    AccountCreated --> Login
    Rejected --> End[Fin]
    Dashboard --> End
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
| **Documentación** | Swagger, JSDoc | N/A | API docs automáticas |
| **Monitoreo** | Sentry, Logtail | N/A | Errores y logs |

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

- **Frontend Web:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000/api/v1](http://localhost:8000/api/v1)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

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
| **Farmacia & POS** | ✅ | 100% | Split payments, catálogo unificado |
| **POS Offline Engine** | ✅ | 100% | IndexedDB, sync automático |
| **Driver & Delivery** | ✅ | 100% | Feed freelance, geolocalización |
| **Entrega Segura QR** | ✅ | 100% | Validación por QR/cédula |
| **Reportes Super Admin** | ✅ | 100% | Heatmaps, Sankey, rankings |
| **Notificaciones Push** | ✅ | 100% | FCM, multi-dispositivo |
| **Modo Adulto Mayor** | ✅ | 100% | Interfaz adaptativa |
| **Documentación API** | ⚠️ | 80% | Swagger en progreso |
| **Pruebas Unitarias** | ⚠️ | 60% | Cobertura parcial |

---

## 📋 Planes y Objetivos Estratégicos

### Visión General

> **"Transformar el acceso a la salud en Nicaragua mediante una plataforma digital que conecte a todos los actores del ecosistema de salud, eliminando barreras geográficas y mejorando la adherencia a los tratamientos."**

### Misión

> **"Proveer una solución tecnológica integral, confiable y accesible que optimice la relación entre clínicas, farmacias y pacientes, utilizando herramientas de código abierto y arquitectura resiliente."**

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

### 📌 PLAN 1: CONSOLIDACIÓN (2026)

| Objetivo Estratégico | Meta | Indicador de Éxito |
|:---|:---|:---|
| **Estabilización técnica** | Cero errores críticos en producción | 99.9% de disponibilidad |
| **Expansión en Managua** | 30 farmacias, 10 clínicas | 5,000 pacientes activos |
| **Optimización POS offline** | 100% de ventas offline sincronizables | Tiempo de sync < 30 seg |
| **Documentación completa** | API docs, manuales de usuario | 100% de cobertura |
| **Soporte multicanal** | WhatsApp + Email + Chat | Respuesta < 1 hora |

**Entregables clave:**
- Plataforma estabilizada sin errores críticos
- Dashboard de Super Admin con métricas en tiempo real
- Sistema de facturación electrónica integrado
- Manuales de usuario para cada rol
- Plan de contingencia y backup automático

---

### 📌 PLAN 2: CRECIMIENTO (2027)

| Objetivo Estratégico | Meta | Indicador de Éxito |
|:---|:---|:---|
| **Expansión departamental** | León, Masaya, Estelí, Matagalpa | 100 farmacias, 30 clínicas |
| **Integración MINSA** | Recetas electrónicas públicas | 20 centros de salud conectados |
| **App móvil nativa** | iOS + Android en stores | 10,000 descargas |
| **Telemedicina** | Consultas virtuales por WhatsApp/Meet | 500 consultas/mes |
| **Programa de fidelización** | Puntos Oasis implementados | 50% de retención |

**Entregables clave:**
- App móvil en Play Store y App Store
- Convenio marco con MINSA firmado
- Portal de transparencia y datos abiertos
- Dashboard regional con comparativas
- Campaña de marketing digital nacional

---

### 📌 PLAN 3: MADUREZ (2028)

| Objetivo Estratégico | Meta | Indicador de Éxito |
|:---|:---|:---|
| **Cobertura nacional** | Todos los departamentos | 500 farmacias, 100 clínicas |
| **Alianzas estratégicas** | 3 aseguradoras, 5 farmacéuticas | Cobertura de 100,000 pacientes |
| **IA predictiva** | Stock forecasting, demanda | 95% de precisión |
| **Certificaciones** | ISO 27001, GDPR ready | Certificación obtenida |
| **Sostenibilidad financiera** | Break-even alcanzado | EBITDA positivo |

**Entregables clave:**
- Modelo de Machine Learning para predicción de stock
- Certificación ISO 27001 en seguridad de datos
- Portal de proveedores y farmacéuticas
- API pública para integraciones de terceros
- Informe de impacto social anual

---

### 📌 PLAN 4: EXPANSIÓN REGIONAL (2029+)

| Objetivo Estratégico | Meta | Indicador de Éxito |
|:---|:---|:---|
| **Expansión regional** | Honduras, Costa Rica, El Salvador | 1000+ farmacias, 300+ clínicas |
| **Franquicia social** | Zonas ultra rurales | 50 comunidades atendidas |
| **Marketplace de salud** | Productos y servicios | 1000+ productos listados |
| **Investigación** | Publicaciones académicas | 5 papers, 3 conferencias |
| **Reconocimiento** | Premios internacionales | 3 premios obtenidos |

**Entregables clave:**
- Subsidiarias legales en cada país
- Acuerdos con ministerios de salud regionales
- Fundación Oasis (brazo social)
- Publicaciones en revistas indexadas
- Modelo de franquicia documentado

---

### KPIs Globales de Éxito

| Indicador | Línea Base | Meta 2026 | Meta 2027 | Meta 2028 |
|:---|:---:|:---:|:---:|:---:|
| **Farmacias afiliadas** | 0 | 30 | 100 | 500 |
| **Clínicas afiliadas** | 0 | 10 | 30 | 100 |
| **Pacientes activos** | 0 | 5,000 | 30,000 | 100,000 |
| **Repartidores activos** | 0 | 100 | 500 | 2,000 |
| **Recetas digitales/mes** | 0 | 10,000 | 50,000 | 200,000 |
| **Tiempo de búsqueda** | 2.5 horas | < 30 min | < 15 min | < 5 min |
| **Satisfacción usuario** | N/A | 85% | 90% | 95% |

---

### Matriz de Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|:---|:---:|:---:|:---|
| **Adopción lenta por farmacias** | Alta | Alto | Capacitación gratuita, soporte dedicado |
| **Problemas de conectividad** | Alta | Medio | Modo offline robusto, sync inteligente |
| **Competencia de apps de delivery** | Media | Medio | Enfoque en salud + recetas, no solo delivery |
| **Cambios regulatorios** | Baja | Alto | Equipo legal, adaptabilidad del sistema |
| **Fuga de datos** | Baja | Crítico | Encriptación, auditorías, ISO 27001 |

---

## 🔮 Visión a Futuro

### Mapa de Ruta Tecnológica

```mermaid
flowchart TB
    subgraph Now["🟢 AHORA (2026)"]
        N1["PWA con Next.js"]
        N2["POS Offline"]
        N3["Recetas QR"]
        N4["Delivery Tracking"]
    end

    subgraph Soon["🟡 CORTO PLAZO (2027)"]
        S1["App React Native"]
        S2["Telemedicina"]
        S3["IA para stock"]
        S4["Chatbots"]
    end

    subgraph Future["🔵 MEDIANO PLAZO (2028)"]
        F1["Machine Learning<br/>Predictivo"]
        F2["Blockchain para<br/>recetas"]
        F3["IoT en cadena<br/>de frío"]
        F4["Biometría facial"]
    end

    subgraph Vision["🟣 VISIÓN (2029+)"]
        V1["Ecosistema completo<br/>de salud digital"]
        V2["Interoperabilidad<br/>regional"]
        V3["Caso de éxito<br/>internacional"]
    end

    Now --> Soon --> Future --> Vision
```

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
    
    section PLAN 4 (2029+)
    Expansión regional         :2029-01-01, 180d
    Marketplace de salud       :2029-07-01, 120d
    Franquicia social          :2030-01-01, 180d
```

### Visión de Impacto Social

```mermaid
mindmap
  root((Oasis Nicaragua<br/>Impacto Social))
    Salud
      Reducción de errores médicos
      Mejor adherencia a tratamientos
      Acceso a medicamentos en zonas rurales
    Economía
      Generación de empleo (repartidores)
      Digitalización de farmacias
      Reducción de pérdidas por vencimiento
    Tecnología
      Inclusión digital (modo mayor)
      Código abierto
      Transferencia tecnológica
    Educación
      Capacitación a farmacéuticos
      Educación para pacientes
      Campañas de salud preventiva
```

### Tecnologías Futuras a Evaluar

```mermaid
graph LR
    subgraph Evaluate["🔬 EN EVALUACIÓN"]
        E1["Blockchain<br/>para trazabilidad"]
        E2["IoT Sensores<br/>cadena de frío"]
        E3["Biometría facial<br/>identificación"]
        E4["AR/VR<br/>telemedicina"]
    end

    subgraph Roadmap["🗺️ ROADMAP"]
        R1["Q3 2026<br/>POC Blockchain"]
        R2["Q1 2027<br/>Pilot IoT"]
        R3["Q3 2027<br/>Biometría opcional"]
        R4["2028<br/>AR consultas"]
    end

    E1 --> R1
    E2 --> R2
    E3 --> R3
    E4 --> R4
```

### Expansión Geográfica

```mermaid
flowchart TB
    subgraph Phase1["FASE 1 (2026)"]
        direction LR
        MGA["Managua<br/>30 farmacias<br/>10 clínicas"]
    end

    subgraph Phase2["FASE 2 (2027)"]
        direction LR
        LEON["León<br/>20 farmacias<br/>5 clínicas"]
        MASAYA["Masaya<br/>15 farmacias<br/>4 clínicas"]
        ESTELI["Estelí<br/>15 farmacias<br/>4 clínicas"]
        MATAGALPA["Matagalpa<br/>10 farmacias<br/>3 clínicas"]
    end

    subgraph Phase3["FASE 3 (2028)"]
        direction LR
        NORTE["Norte<br/> Jinotega, Ocotal"]
        SUR["Sur<br/>Rivas, Juigalpa"]
        CARIBE["Caribe<br/>Bluefields, Puerto"]
    end

    subgraph Phase4["FASE 4 (2029+)"]
        direction LR
        HONDURAS["Honduras<br/>Tegucigalpa, SPS"]
        COSTARICA["Costa Rica<br/>San José"]
        SALVADOR["El Salvador<br/>San Salvador"]
    end

    Phase1 --> Phase2 --> Phase3 --> Phase4
```

### Modelo de Negocio y Sostenibilidad

```mermaid
graph TB
    subgraph Revenue["💰 FUENTES DE INGRESO"]
        R1["Suscripción<br/>farmacias/clínicas"]
        R2["Comisión<br/>por delivery"]
        R3["Publicidad<br/>farmacéuticas"]
        R4["Premium<br/>para pacientes"]
        R5["Datos anonimizados<br/>para investigación"]
    end

    subgraph Costs["💸 COSTOS"]
        C1["Infraestructura<br/>cloud"]
        C2["Soporte técnico"]
        C3["Marketing"]
        C4["Desarrollo continuo"]
    end

    subgraph Investment["📈 INVERSIÓN"]
        I1["Bootstrapping<br/>fase inicial"]
        I2["Angel investors<br/>fase crecimiento"]
        I3["Venture Capital<br/>fase expansión"]
    end

    Revenue --> Investment
    Investment --> Costs
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor sigue estos pasos:

1. **Fork** el repositorio
2. Crea tu rama: `git checkout -b feature/amazing-feature`
3. **Commit** tus cambios: `git commit -m 'feat: add amazing feature'`
4. **Push** a la rama: `git push origin feature/amazing-feature`
5. Abre un **Pull Request**

### 📋 Estilo de Código

- TypeScript estricto (`strict: true`)
- ESLint + Prettier para formato
- Commits convencionales (Conventional Commits)
- Pruebas unitarias para servicios críticos

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT** - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- **OpenStreetMap** por los datos cartográficos gratuitos
- **Firebase** por las notificaciones push
- **Supabase** por la infraestructura de base de datos
- **Comunidad de Nicaragua** por las pruebas y retroalimentación

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