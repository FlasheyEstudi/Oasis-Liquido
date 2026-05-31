import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    console.log('👥 DATABASE USERS LIST:');
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
