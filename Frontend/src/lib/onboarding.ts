// ============================================
// OASIS - Onboarding Steps Configuration
// Interactive guides for new users based on roles
// ============================================

export interface OnboardingStep {
  title: string;
  description: string;
  elementId?: string; // Optional element selector to highlight in step
}

export const onboardingSteps: Record<'patient' | 'pharmacy' | 'clinic', OnboardingStep[]> = {
  patient: [
    {
      title: "Regístrate o inicia sesión",
      description: "Crea tu cuenta de Paciente utilizando tu correo electrónico. Recibirás un correo de verificación automático para activar tus credenciales.",
    },
    {
      title: "Recibe tu receta QR digital",
      description: "Cuando visites a tu médico en una clínica Oasis afiliada, se emitirá una receta digital con firma electrónica certificada y un código QR único.",
    },
    {
      title: "Busca tu medicamento",
      description: "Explora la disponibilidad de medicamentos en tiempo real a través de nuestro buscador nacional de farmacias.",
    },
    {
      title: "Pide delivery o retira en local",
      description: "Selecciona el método de entrega de tu preferencia. Puedes elegir envío a domicilio o pasar a recoger a la sucursal seleccionada.",
    },
  ],
  pharmacy: [
    {
      title: "Accede al panel de Farmacia",
      description: "Ingresa como administrador o staff de farmacia para visualizar tus estadísticas de venta en tiempo real y el rendimiento del local.",
    },
    {
      title: "Sincroniza y ajusta tu inventario",
      description: "Actualiza los lotes, costos y precios de venta de tus medicamentos. El sistema emite alertas preventivas ante desabastecimiento.",
    },
    {
      title: "Valida y surte recetas QR",
      description: "Utiliza la cámara de tu dispositivo o el escáner para escanear el QR del paciente. El sistema validará la autenticidad y descontará del stock.",
    },
    {
      title: "Asigna órdenes de delivery",
      description: "Asigna los pedidos listos a los repartidores disponibles. Podrás monitorear su ubicación en tiempo real mediante telemetría satelital.",
    },
  ],
  clinic: [
    {
      title: "Gestiona tu consultorio médico",
      description: "Como dueño de clínica, administra los consultorios, especialidades activas y los médicos del plantel.",
    },
    {
      title: "Monitorea la carga de citas",
      description: "Visualiza la agenda del día mediante la onda de carga de trabajo. Optimiza la distribución horaria de las citas.",
    },
    {
      title: "Prescribe con firma digital",
      description: "Emite recetas electrónicas con firma digital encriptada por el módulo de seguridad HSM, cumpliendo con los estándares regulados.",
    },
    {
      title: "Analiza el desempeño médico",
      description: "Compara de forma agregada las dimensiones de puntualidad, satisfacción de pacientes y recetas efectivas de tus profesionales.",
    },
  ],
};
