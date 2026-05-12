import { NextResponse } from 'next/server';

export async function GET() {
  const BASE = process.env.NEXT_PUBLIC_SICE_API_BASE;

  if (!BASE) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_SICE_API_BASE no está configurado' },
      { status: 500 },
    );
  }

  const response = await fetch(`${BASE}/Public/GetIntegracion`, {
    headers: { Accept: 'application/json' },
    // La petición se hace servidor→servidor, sin restricciones CORS
    cache: 'no-store',
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Error al consultar SICE', status: response.status },
      { status: response.status },
    );
  }

  const responseJson = await response.json();
  const data = responseJson?.data;

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, max-age=300',
    },
  });
}
