// OASIS - Health Check Route
// GET /api/v1/health

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check DB connection
    await db.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        api: "healthy"
      }
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      services: {
        database: "disconnected",
        api: "healthy"
      },
      error: error.message
    }, { status: 503 });
  }
}
