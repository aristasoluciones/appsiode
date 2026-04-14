import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/device
 * Devuelve la IP del cliente tal como la ve el servidor.
 * Soporta proxies y load balancers (x-forwarded-for).
 */
export async function GET(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') ?? 'desconocida';

  return NextResponse.json({ ip });
}
