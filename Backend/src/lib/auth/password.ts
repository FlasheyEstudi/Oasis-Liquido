// OASIS - Password Hashing Utilities
// Uses bcryptjs for secure password hashing

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || typeof hash !== 'string') return false;
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$') && !hash.startsWith('$2y$')) {
    return password === hash;
  }
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    return password === hash;
  }
}
