// OASIS - Diagnóstico de Base de Datos y Servidor
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient({
  log: ['query', 'error', 'info', 'warn'],
});

async function run() {
  console.log('🔍 Iniciando diagnóstico de base de datos de producción...');
  console.log('🔌 Conectando con DATABASE_URL...');

  try {
    // 1. Probar conexión básica
    console.log('📡 Intentando consultar el primer usuario...');
    const userCount = await db.user.count();
    console.log(`✅ Conexión exitosa. Total de usuarios en la base de datos: ${userCount}`);

    // 2. Probar roles de demo
    console.log('👥 Consultando usuarios demo por rol (paciente)...');
    const patientUser = await db.user.findFirst({
      where: { role: 'patient', isActive: true },
      include: { patientProfile: true }
    });
    console.log('✅ Consulta de paciente demo exitosa:', patientUser ? `ID: ${patientUser.id}, Email: ${patientUser.email}` : 'No se encontró paciente demo activo.');

    // 3. Probar si PasswordResetToken existe
    console.log('🔑 Comprobando existencia de la tabla password_reset_tokens...');
    try {
      const resetTokenCount = await db.passwordResetToken.count();
      console.log(`✅ Tabla password_reset_tokens existe. Registros: ${resetTokenCount}`);
    } catch (e) {
      console.error('❌ Error al acceder a passwordResetToken. ¿Falta ejecutar "db push"?', e.message);
    }

    // 4. Probar creación de refresh token
    console.log('🎫 Probando estructura de la tabla refreshToken...');
    try {
      const rfCount = await db.refreshToken.count();
      console.log(`✅ Tabla refreshToken existe. Registros: ${rfCount}`);
    } catch (e) {
      console.error('❌ Error al acceder a refreshToken:', e.message);
    }

  } catch (error) {
    console.error('💥 ERROR DE CONEXIÓN O CONSULTA:', error);
  } finally {
    await db.$disconnect();
    console.log('🏁 Diagnóstico finalizado.');
  }
}

run();
