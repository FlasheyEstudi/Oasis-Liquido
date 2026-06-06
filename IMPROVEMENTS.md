# 🚀 MEJORAS RECOMENDADAS: OASIS NICARAGUA

Este documento detalla sugerencias de refactorización y optimizaciones de ingeniería para elevar el rendimiento, la resiliencia y el mantenimiento del ecosistema Oasis.

---

## 💻 1. Refactorización a Importaciones Dinámicas de ESM (Backend)

Actualmente, el backend utiliza `require()` dentro de varios archivos de servicio (`delivery.service.ts`, `notification.service.ts`, `sale.service.ts`, etc.) para evitar dependencias circulares. Aunque funciona perfectamente, no es el estándar de ESM (EcmaScript Modules) nativo y puede confundir a linters.

* **Recomendación:** Reemplazar los llamados `require()` con importaciones dinámicas basadas en Promesas (`await import()`).
* **Ejemplo de refactorización:**
  ```typescript
  // Antes (delivery.service.ts):
  const { NotificationService } = require('./notification.service');
  NotificationService.createNotification(...);
  
  // Después:
  const { NotificationService } = await import('./notification.service');
  await NotificationService.createNotification(...);
  ```

---

## 🗄️ 2. Migración de Configuración de Prisma (Cumplimiento de Prisma 7)

Prisma 6.x advierte sobre la desaprobación de la propiedad `"prisma"` en el `package.json` para definir el script de seeding.

* **Recomendación:** Eliminar el bloque `"prisma"` de `package.json` y crear un archivo de configuración `prisma.config.ts` en la raíz del backend:
  ```typescript
  import { defineConfig } from 'prisma';

  export default defineConfig({
    seed: {
      command: 'npx jiti prisma/seed.ts',
    },
  });
  ```

---

## 🧪 3. Inicialización del Entorno de Pruebas (Vitest & Playwright)

Tanto el Backend como el Frontend tienen configurado un suite de pruebas con Vitest, pero las carpetas de pruebas contienen plantillas vacías.

* **Recomendación:** Crear pruebas unitarias e integradas automatizadas para los siguientes componentes de alta criticidad:
  1. **Pruebas de Descuento de Stock POS:** Simular ventas concurrentes del mismo lote de medicamentos para asegurar que no se produzcan sobreventas (Double Spend) y que se aplique correctamente el modelo FEFO.
  2. **Pruebas de Geolocalización Leaflet / MapLibre:** Asegurar que los componentes de mapas no se rendericen en el servidor (SSR) usando envoltorios `dynamic(() => import(...), { ssr: false })` para evitar errores de referencia de `window`.
  3. **Pruebas de Sincronización de IndexedDB:** Verificar que los registros de ventas locales en IndexedDB se transmitan y limpien adecuadamente una vez que la conexión de red se restaura.

---

## ⚡ 4. Optimización de Rendimiento en Rutas Cartográficas

El backend consulta a la red externa de OSRM/OpenStreetMap para calcular distancias de entregas en tiempo real. Esto puede introducir latencia o fallos si el servidor cartográfico externo está saturado.

* **Recomendación:** Implementar una capa de caché (ej. Redis o almacenamiento temporal en base de datos) para guardar distancias calculadas entre coordenadas geográficas comunes en Nicaragua, reduciendo la dependencia de APIs externas.
