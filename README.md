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

*Una suite digital premium de grado empresarial que interconecta Clínicas, Médicos, Farmacias, Cajeros, Repartidores y Pacientes en Nicaragua con soporte resiliente offline, analíticas avanzadas en vivo y notificaciones nativas push.*

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
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contribuciones](#-contribuciones)
- [📄 Licencia](#-licencia)

---

## 🌟 Características Clave

> [!IMPORTANT]
> **Oasis** ha sido diseñado con resiliencia offline, modo adulto mayor y analíticas en tiempo real para el ecosistema de salud nicaragüense.

### 🏥 **Módulo Clínico Avanzado**

| Característica | Descripción |
|----------------|-------------|
| **Consultas Médicas** | Interfaz médica sofisticada para emisión y firma digital de recetas encriptadas con QR de alta seguridad |
| **Control de Citas** | Recepcionistas con agendas interactivas fluidas y prevención inteligente de inasistencias (*no-shows*) |
| **Firma Digital** | Verificación y firma atómica de recetas por médicos certificados |
| **Modo Adulto Mayor** | Interfaz adaptada con fuentes grandes, alto contraste y botones ampliados |

### 💊 **Punto de Venta (POS) & Inventario**

| Característica | Descripción |
|----------------|-------------|
| **Resiliencia Offline** | Service Workers e IndexedDB garantizan operación continua sin internet |
| **Split Payments** | Soporte robusto para cobros compuestos (tarjeta, transferencia, efectivo) |
| **Sincronización BG** | Subida automática de ventas offline cuando recupera conectividad |
| **Kardex Digital** | Trazabilidad completa de movimientos de inventario |

### 🚗 **Logística de Distribución Freelance**

| Característica | Descripción |
|----------------|-------------|
| **Driver Dashboard** | Feed dinámico de órdenes pendientes con aceptación inmediata |
| **Geolocalización en Vivo** | Seguimiento GPS continuo durante la ruta de entrega |
| **Entrega Segura** | Validación física mediante QR digital o identificación por cédula |
| **Rutas Optimizadas** | Cálculo automático de rutas usando OpenStreetMap |

### 🔔 **Notificaciones Push Contextuales**

| Característica | Descripción |
|----------------|-------------|
| **FCM Nativo** | Integración con Firebase Cloud Messaging |
| **Alertas Instantáneas** | Notificaciones al asignar delivery, emitir receta o completar entrega |
| **Multi-dispositivo** | Soporte para múltiples dispositivos por usuario |

### 📊 **Panel de Control Premium (Super Admin)**

| Característica | Descripción |
|----------------|-------------|
| **Mapa de Calor Temporal** | Visualización interactiva de ingresos por período |
| **Distribución Geográfica** | Mapa de Nicaragua con burbujas proporcionales de ventas |
| **Ranking por Entidad** | Comparativa dinámica de ingresos por clínica/farmacia |
| **Sankey Flow Diagram** | Embudo transaccional desde consulta hasta entrega |

---

## 📐 Arquitectura del Sistema

```mermaid
graph TB
    subgraph Client["🌐 CLIENTE (PWA)"]
        UI["Next.js App Router<br/>React 19 UI"]
        SW["Service Worker<br/>Catálogo & Push"]
        IDB[("IndexedDB<br/>Almacenamiento Local")]
        Sync["Sync Manager<br/>Auto-sincronización"]
    end

    subgraph Backend["⚙️ SERVIDOR CENTRAL"]
        Auth["Middleware<br/>JWT + Roles"]
        Routes["API Routes<br/>Next.js Handlers"]
        Analytics["Analytics<br/>Reporting Service"]
    end

    subgraph Services["🔌 SERVICIOS EXTERNOS"]
        FCM["Firebase Cloud Messaging<br/>Notificaciones Push"]
        Maps["OpenStreetMap + Leaflet<br/>Geolocalización y Rutas"]
    end

    subgraph Storage["💾 CAPA DE DATOS"]
        Prisma["Prisma ORM<br/>Type-Safe Queries"]
        DB[(("PostgreSQL / Supabase<br/>Base de Datos Principal"))]
        S3[("S3 / Supabase Storage<br/>Documentos e Imágenes")]
    end

    %% Conexiones
    UI <--> IDB
    UI -->|Venta Offline| SW
    SW <-->|Sincronización| Sync
    Sync -->|REST API| Auth
    Auth --> Routes
    Routes --> Analytics
    Routes --> Prisma
    Routes --> FCM
    Routes --> Maps
    Prisma --> DB
    UI -->|Upload Files| S3

    %% Estilos
    classDef client fill:#0D9488,stroke:#0F766E,color:#fff
    classDef backend fill:#1E40AF,stroke:#1E3A8A,color:#fff
    classDef services fill:#EA580C,stroke:#C2410C,color:#fff
    classDef storage fill:#64748B,stroke:#475569,color:#fff
    
    class UI,SW,IDB,Sync client
    class Auth,Routes,Analytics backend
    class FCM,Maps services
    class Prisma,DB,S3 storage
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

## 🗺️ Roadmap

```mermaid
timeline
    title Hoja de Ruta Oasis Nicaragua
    section Fase 1 (2024)
        MVP Funcional
        : Autenticación JWT
        : Recetas QR básicas
        : POS con split payments
        : Delivery tracking
    section Fase 2 (2025)
        Escalamiento Nacional
        : 50+ farmacias
        : 20+ clínicas
        : Reportes avanzados
        : Modo offline completo
    section Fase 3 (2026)
        Integración MINSA
        : Recetas públicas
        : Telemedicina
        : Farmacias comunitarias
        : IA para stock predictivo
    section Fase 4 (2027)
        Expansión Regional
        : Honduras y Costa Rica
        : Alianzas con aseguradoras
        : Marketplace de salud
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

## 🔗 Enlaces Rápidos

| Recurso | Enlace |
|:---|:---|
| **Documentación API** | [https://api.oasisnicaragua.com/docs](https://api.oasisnicaragua.com/docs) |
| **Demo en Vivo** | [https://demo.oasisnicaragua.com](https://demo.oasisnicaragua.com) |
| **Reporte de Bugs** | [GitHub Issues](https://github.com/tuusuario/oasis-nicaragua/issues) |
| **Soporte Técnico** | [soporte@oasisnicaragua.com](mailto:soporte@oasisnicaragua.com) |

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
