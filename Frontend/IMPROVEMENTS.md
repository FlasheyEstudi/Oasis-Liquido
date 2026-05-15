# OASIS Frontend — Improvements & Preparation Log

Este documento detalla las mejoras realizadas al frontend de OASIS para asegurar que esté listo para la integración con el backend real y cumpla con los estándares de producción especificados.

## 1. Seguridad y Autenticación
- **Token Management**: Se ha refactorizado `src/api/client.ts` para eliminar el almacenamiento de `access_token` y `refresh_token` en `localStorage`. 
  - El `access_token` ahora vive únicamente en memoria (state).
  - El `refresh_token` se maneja a través de cookies `httpOnly` configuradas por el servidor (`withCredentials: true`).
- **Hydration Flow**: El flujo de hidratación en `src/store/auth-store.ts` ahora es asíncrono y realiza una llamada real a `/auth/refresh` al iniciar la aplicación para recuperar la sesión activa sin exponer tokens en el almacenamiento del navegador.
- **Interceptors**: Se han optimizado los interceptores de Axios para manejar renovaciones de token transparentes y redirigir al login solo cuando la sesión ha expirado realmente.

## 2. Limpieza de "Mocks" y Datos Demo
- **Eliminación de RoleSwitcher**: Se ha removido el componente `RoleSwitcher` y toda la lógica de "Modo Demo" de las pantallas de Login, Landing y el Store. La aplicación ahora solo permite el acceso a través de credenciales reales.
- **Limpieza de Directorios**: Se han eliminado las carpetas `prisma/`, `db/` y `mini-services/` que contenían lógica de backend/base de datos local, dejando un repositorio de frontend puro.
- **Naming & Branding**: Se han actualizado todas las referencias de "MediRed" a "OASIS" en los servicios de API, tipos y componentes de UI.

## 3. Infraestructura y Configuración
- **Environment Variables**: Se ha creado un archivo `.env.local` con las variables necesarias para la conexión al backend (`NEXT_PUBLIC_API_BASE_URL`) y la configuración del mapa (`NEXT_PUBLIC_MAP_STYLE`).
- **Dependencies**: Se han instalado las dependencias faltantes para la UI (`@headlessui/react`, `@heroicons/react`, `react-hot-toast`) asegurando que el sistema de diseño esté completo.
- **Map Integration**: Se ha verificado que el componente `MapView` utiliza `maplibre-gl` con teselas de `OpenFreeMap`, eliminando la necesidad de API keys de terceros.

## 4. Estructura del Proyecto
- **App Router**: Se ha mantenido la arquitectura de Single Page (SPA) dentro de Next.js para preservar las transiciones fluidas de `AppLayout`, pero se han limpiado los puntos de entrada para facilitar la migración a rutas individuales si fuera necesario en el futuro.
- **Liquid Glass Design**: Se ha validado que los estilos en `globals.css` cumplen con el estándar visual de "Liquid Glass 2.0" (transparencias, desenfoques, bordes sutiles y animaciones orgánicas).

## Próximos Pasos (Conexión al Backend)
1. **URL del API**: Asegurarse de que `NEXT_PUBLIC_API_BASE_URL` en `.env.local` apunte a la instancia correcta del backend.
2. **CORS**: El backend debe permitir el origen del frontend y habilitar `credentials: true`.
3. **Endpoints**: Verificar que los endpoints en `src/api/*.ts` coincidan exactamente con la implementación del equipo de backend.

---
**Proyecto preparado para inicio de integración.**
