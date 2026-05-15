
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({ where: { email: 'maria@oasis.com' } });
  if (!user) {
    console.log('User not found');
    return;
  }
  console.log('User found:', user.email, 'Role:', user.role);
  const valid = await bcrypt.compare('password123', user.passwordHash);
  console.log('Password valid:', valid);
  process.exit(0);
}

check();
