import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL(url.pathname.replace('/api/auth/', '/api/v1/auth/'), request.url));
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  // Using 307 Temporary Redirect to preserve POST method and body
  return NextResponse.redirect(new URL(url.pathname.replace('/api/auth/', '/api/v1/auth/'), request.url), 307);
}
