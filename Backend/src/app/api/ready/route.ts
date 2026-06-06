import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Quick db check to ensure everything is initialized and queryable
    await db.user.findFirst({ select: { id: true } });
    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
