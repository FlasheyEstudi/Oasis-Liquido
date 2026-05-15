// OASIS - Auth Logout Route
// POST /api/auth/logout

import { NextRequest, NextResponse } from 'next/server';
import { successResponse } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  const response = successResponse({}, 'Sesión cerrada');
  
  // Clear refresh token cookie
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
