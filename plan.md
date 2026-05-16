1. **Implementar "Telemedicina vía WhatsApp" (Doctor)**
   - Modificar `Frontend/src/components/doctor/doctor-dashboard.tsx` y/o `consultation.tsx` para agregar un botón de "Iniciar Telemedicina (WhatsApp)" que abra un enlace `wa.me` con el número del paciente.

2. **Implementar "Seguimiento con Citas" (Doctor)**
   - En `Frontend/src/components/doctor/consultation.tsx`, agregar un botón o flujo para agendar una cita de seguimiento. (Puede ser simplemente un botón que llame a una mutación para crear una nueva cita).

3. **Implementar "Alerta de Stock Bajo" (Gerente Farmacia)**
   - En `Frontend/src/components/pharmacy/pharmacy-dashboard.tsx`, añadir un Toast (notificación) al cargar si hay items en `lowStockItems`. Y crear una alerta más visible.

4. **Mejorar "Smart Prescriber con Búsqueda Inteligente de Farmacias" (Paciente)**
   - En `Backend/src/lib/services/pharmacy.service.ts`, ajustar la lógica de `getPharmacies` para que devuelva cuántos medicamentos coinciden o para forzar coincidencia completa, de manera que la búsqueda inteligente sea más certera. En `Frontend/src/components/patient/pharmacy-map.tsx`, mostrar un indicador visual de "Esta farmacia tiene todos los medicamentos" vs "Tiene X de Y medicamentos", y sugerir dividir la receta si ninguna tiene todos.

5. **Mejorar "Enrutamiento Gratuito" y "Prueba de Entrega vía QR" (Repartidor)**
   - En `Frontend/src/components/common/map-view-inner.tsx`, asegúrese de que apunte a la API backend `getApiUrl() + /routes/driving` (actualmente hace un fetch relativo `/api/v1/...` que podría fallar si el dominio es distinto, se debe usar `client.ts` o la URL base correcta).
   - En `Frontend/src/components/delivery/delivery-detail.tsx`, añadir botón "Prueba de Entrega vía QR (Opcional)" antes de "Marcar como entregado".

6. **Completar los pasos previos al commit**
   - Completar los pasos requeridos para hacer commit, pruebas, validación, etc.

7. **Enviar los cambios (Submit)**
