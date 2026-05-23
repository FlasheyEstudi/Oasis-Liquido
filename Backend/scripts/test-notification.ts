import { NotificationService } from '../src/lib/services/notification.service';
import { db } from '../src/lib/db';

async function testNotification() {
  console.log('🔍 Searching for a user with registered push tokens...');
  
  // Find a user that has tokens
  const userWithTokens = await db.user.findFirst({
    where: {
      pushTokens: { some: {} }
    },
    include: {
      pushTokens: true
    }
  });

  if (!userWithTokens) {
    console.log('❌ No users with push tokens found. Please register a token from the frontend first.');
    return;
  }

  console.log(`✅ Sending test notification to user: ${userWithTokens.name || userWithTokens.email}`);
  console.log(`📱 Active tokens found: ${userWithTokens.pushTokens.length}`);

  await NotificationService.sendToUser(userWithTokens.id, {
    title: '🔔 Oasis Nicaragua',
    body: 'Esta es una notificación de prueba. ¡Tu sistema de mensajería push está funcionando!',
    data: {
      type: 'test',
      timestamp: new Date().toISOString(),
    },
    userId: userWithTokens.id,
  });

  console.log('🚀 Test notification request submitted successfully!');
}

testNotification().catch(console.error);
