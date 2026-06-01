import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    console.log('Attempting to query findFirst user...');
    const user = await prisma.user.findFirst({
      where: { role: 'patient' }
    });
    console.log('Query succeeded!', user);
  } catch (error: any) {
    console.error('DATABASE QUERY FAILED WITH ERROR:');
    console.error(error);
    if (error.code) console.error('Error Code:', error.code);
    if (error.meta) console.error('Error Meta:', JSON.stringify(error.meta, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main();
