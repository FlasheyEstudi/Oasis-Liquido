// OASIS - Servicio de Redirección y Simulación WhatsApp (100% Sin Costo)
// Diseñado para operar sin APIs pagadas (Twilio o Meta Cloud) para el mercado nicaragüense

/**
 * Normaliza y sanea números telefónicos para Nicaragua (+505)
 */
export function formatNicaraguanPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  // Si no tiene el código de país de Nicaragua, agregarlo
  if (cleaned.length === 8) {
    cleaned = '505' + cleaned;
  }
  
  return cleaned;
}

/**
 * Genera un enlace Click-to-Chat de WhatsApp (wa.me) totalmente gratuito
 * Abre la app nativa en teléfonos/PC con texto prellenado sin usar APIs de pago.
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  const formattedPhone = formatNicaraguanPhone(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Simula de manera gratuita en servidor y genera enlaces click-to-chat
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<{ success: boolean; messageId: string; waLink: string }> {
  const formattedPhone = formatNicaraguanPhone(to);
  const waLink = generateWhatsAppLink(to, body);
  
  console.log(`\n======================================================`);
  console.log(`📱 [WHATSAPP GRATUITO - ENLACE CLIC-TO-CHAT]`);
  console.log(`📞 Destino Claro/Tigo: +${formattedPhone}`);
  console.log(`✉️ Contenido: ${body}`);
  console.log(`🔗 Enlace wa.me Directo: ${waLink}`);
  console.log(`======================================================\n`);
  
  return {
    success: true,
    messageId: `free_wa_${Date.now()}`,
    waLink
  };
}

/**
 * Generador de enlaces para códigos de recuperación
 */
export async function sendWhatsAppOTP(to: string, code: string): Promise<boolean> {
  const body = `🏝️ [Oasis Líquida] Mi código de recuperación de Oasis es: ${code}`;
  const result = await sendWhatsAppMessage(to, body);
  return result.success;
}

/**
 * Notificación de receta lista sin costo
 */
export async function sendPrescriptionReadyAlert(
  to: string,
  patientName: string,
  prescriptionCode: string
): Promise<boolean> {
  const body = `💊 Hola ${patientName}, mi receta con código *${prescriptionCode}* ya está lista en Oasis.`;
  const result = await sendWhatsAppMessage(to, body);
  return result.success;
}
