// OASIS - JWT Utilities
// Handles access token and refresh token generation/verification

import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'oasis-access-secret-dev';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'oasis-refresh-secret-dev';
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  clinicId?: string;
  pharmacyId?: string;
}

/**
 * Sign a new access token (15 min expiry)
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
}

/**
 * Verify an access token, returns payload or null
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Sign a new refresh token (7 days expiry)
 */
export function signRefreshToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
}

/**
 * Verify a refresh token, returns payload or null
 */
export function verifyRefreshToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Generate a random token for password reset
 */
export function generateResetToken(): string {
  return jwt.sign(
    { purpose: 'password_reset', timestamp: Date.now() },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Verify a password reset token
 */
export function verifyResetToken(token: string): { valid: boolean } {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { purpose: string };
    return { valid: decoded.purpose === 'password_reset' };
  } catch {
    return { valid: false };
  }
}
