# 📋 CHECKLIST DE LISTO PARA PRODUCCIÓN: BACKEND OASIS

Este documento sirve como la lista de verificación final para el despliegue a producción del backend del ecosistema Oasis Nicaragua.

---

## 🔒 1. Seguridad y Autenticación
- [ ] **Secretos JWT:** Verificar que `JWT_SECRET` y `JWT_REFRESH_SECRET` sean cadenas de alta entropía generadas con criptografía segura (ej. `openssl rand -base64 32`) en lugar de contraseñas por defecto.
- [ ] **Rate Limiting:** Asegurar que el middleware de límite de peticiones (100 req/min) esté activo y cubra todas las rutas `/api/v1/*` para prevenir ataques DDoS.
- [ ] **Políticas CORS:** Configurar explícitamente los dominios del frontend permitidos en producción en lugar de usar comodines (`*`).

---

## 🗄️ 2. Base de Datos y Supabase
- [ ] **Pool de Conexiones (Connection Pooling):** En producción, configurar `DATABASE_URL` para apuntar al puerto de pooling de Supabase (puerto `6543`) y usar `DIRECT_DATABASE_URL` (puerto `5432`) exclusivamente para migraciones directas de Prisma.
- [ ] **Migraciones Ejecutadas:** Correr `npx prisma migrate deploy` en la base de datos de producción para aplicar todas las estructuras relacionales sin reiniciar o borrar datos.
- [ ] **Políticas RLS en Supabase:** Si se accede a Supabase directamente, verificar que Row Level Security (RLS) esté configurado para que los usuarios no puedan leer documentos médicos o recetas de terceros.

---

## 📡 3. Integración de Servicios Externos
- [ ] **Firebase Cloud Messaging (FCM):**
  - [ ] Validar que la variable de entorno `FIREBASE_PRIVATE_KEY` en producción tenga el formato de saltos de línea correcto (`\n`) y que corresponda a la cuenta de servicio activa.
  - [ ] Verificar el envío de notificaciones push de prueba desde la API en producción a un cliente Android/iOS simulado.
- [ ] **OSRM / OpenStreetMap:**
  - [ ] Verificar disponibilidad de servidores de mapas OSRM de respaldo para el cálculo de rutas de reparto si el servidor principal falla.
- [ ] **Configuraciones Globales en BD:**
  - [ ] Verificar que las tarifas por kilómetro y el radio máximo de cobertura de farmacias estén debidamente configurados en la tabla `global_settings` o `pharmacy_settings` en producción.

---

## 📊 4. Monitoreo y Auditoría
- [ ] **Logs de Auditoría Activos:** Confirmar que todas las mutaciones críticas (creación de recetas, despacho de POS, asignación de courier) escriban correctamente en la tabla `audit_logs` con la IP real del cliente (usando encabezados como `x-forwarded-for`).
- [ ] **Monitoreo del Servidor:** Integrar un gestor de procesos (ej. PM2) o monitor en la nube para reiniciar el servicio Next.js en producción en caso de desbordamiento de memoria u otros errores imprevistos.
