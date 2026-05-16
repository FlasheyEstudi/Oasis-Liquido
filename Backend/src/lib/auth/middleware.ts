// OASIS - Auth Middleware
// withAuth(handler, { roles?: string[] }) for route protection

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, AccessTokenPayload } from './jwt';
import { errorResponse, ErrorCodes } from '../utils/api-response';

export interface AuthenticatedRequest extends NextRequest {
  user: AccessTokenPayload;
}

type HandlerFn = (
  req: any,
  context: any
) => Promise<NextResponse>;

interface AuthOptions {
  roles?: string[]; // If provided, only these roles can access
  optional?: boolean; // If true, auth is optional (public endpoints may use this)
}

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Authentication middleware wrapper for Next.js API routes
 * Usage: export const GET = withAuth(async (req, context) => { ... }, { roles: ['admin'] })
 */
export function withAuth(handler: HandlerFn, options: AuthOptions = {}): HandlerFn {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    const token = extractToken(req);

    if (!token) {
      if (options.optional) {
        // For optional auth, proceed without user
        return handler(req, context);
      }
      return errorResponse(ErrorCodes.UNAUTHORIZED, 'Token de acceso requerido', 401);
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return errorResponse(ErrorCodes.TOKEN_INVALID, 'Token inválido o expirado', 401);
    }

    // Check role-based access
    if (options.roles && options.roles.length > 0) {
      if (!options.roles.includes(payload.role)) {
        return errorResponse(ErrorCodes.FORBIDDEN, 'No tienes permisos para realizar esta acción', 403);
      }
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = payload;

    return handler(req as AuthenticatedRequest, context);
  };
}

/**
 * Extract user from request (use after withAuth)
 */
export function getUserFromRequest(req: NextRequest): AccessTokenPayload | null {
  return (req as AuthenticatedRequest).user || null;
}
