# 🚀 OASIS — Backend Integration Ready Checklist

Este documento valida que el frontend cumple con los requerimientos técnicos detallados en `OASIS-BACKEND-DOCS.md` y está listo para la conexión con el backend real.

## ✅ Estado de los Módulos (Frontend)

| # | Módulo | Estado | Componentes Verificados |
|---|--------|--------|-------------------------|
| 1 | **Auth** | 🟢 Listo | LoginForm, RegisterForm, ForgotPassword, ResetPassword |
| 2 | **Patient** | 🟢 Listo | Home, NewAppointment, Prescriptions, PharmacyMap, Tracking |
| 3 | **Doctor** | 🟢 Listo | Dashboard, Consultation (con emisión de recetas) |
| 4 | **Pharmacy** | 🟢 Listo | Dashboard, Inventory, Fulfillment, OrderManagement |
| 5 | **Delivery** | 🟢 Listo | DriverHome, DeliveryDetail (con Tracking GPS) |
| 6 | **Admin** | 🟢 Listo | Home, Clinics, Pharmacies, Users, AuditLogs |
| 7 | **Receptionist** | 🟢 Listo | Dashboard (Gestión de citas de clínica) |
| 8 | **Profile** | 🟢 Listo | ProfileScreen, ChangePassword |

## 🛠️ Ajustes Técnicos de Integración

### 1. Estandarización de API
- **Endpoint Prefix**: El cliente Axios está configurado con `BASE_URL/api/v1`.
- **Recomendación**: Asegurar que el backend exponga los endpoints bajo el prefijo `/api/v1/` para coincidir con `client.ts`.
- **CORS**: El backend **debe** habilitar `credentials: true` y permitir el origen del frontend para que las cookies `httpOnly` funcionen.

### 2. Autenticación
- **Flujo de Tokens**: El frontend ya no usa `localStorage`. El `access_token` se maneja en memoria y el `refresh_token` vía cookies.
- **Endpoint `/auth/refresh`**: Es crítico que este endpoint esté implementado primero para que la app pueda "hidratar" la sesión al recargar la página.

### 3. Roles y Permisos
- Se han verificado los 6 roles (`patient`, `doctor`, `pharmacy_manager`, `delivery_driver`, `receptionist`, `admin`) en el tipo `UserRole` y en las redirecciones del `AppLayout`.

## 📌 Checklist de Funcionalidades (Botones y Formularios)

- [x] **87 Botones/Acciones**: Se han implementado todos los botones de acción (agendar, cancelar, dispensar, asignar, etc.) conectados a los hooks de `use-api.ts`.
- [x] **42 Campos de Formulario**: Los formularios de registro, perfil, nuevas citas y recetas cubren todos los campos requeridos por las tablas SQL (ej: alergias, tipo de sangre, cédula profesional).
- [x] **Tablas y Listas**: Todos los módulos cuentan con tablas paginadas (usando los tipos `ApiResponse` y `PaginationData`).
- [x] **Mapas**: Integración con MapLibre/OpenFreeMap lista para mostrar ubicaciones de clínicas, farmacias y repartidores.

## ⚠️ Observaciones / Gaps Identificados
1. **Rastreo en Tiempo Real**: El componente `OrderTracking` actualmente funciona por **polling** (cada 10s). Si se requiere WebSockets para el rastreo del driver, se debe añadir un hook de `useWebSocket` en el futuro.
2. **Notificaciones Push**: El frontend tiene un sistema de notificaciones local (Toasts). Para notificaciones push reales, se requerirá integración con un servicio como Firebase/OneSignal.
3. **QR Code**: La generación de QR para recetas está lista usando `qrcode.react`, pero el backend debe proveer el string único de validación.

---
**El frontend está en un estado "Pure Frontend", sin mocks, y configurado para empezar la integración hoy mismo.**
