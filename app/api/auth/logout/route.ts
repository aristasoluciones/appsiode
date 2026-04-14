import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { status: 200, message: 'Sesión cerrada', data: null },
    { status: 200 },
  );

  response.cookies.set('AccessToken', '', { maxAge: 0, path: '/' });
  response.cookies.set('RefreshToken', '', { maxAge: 0, path: '/' });
  response.cookies.set('X-CSRF-TOKEN', '', { maxAge: 0, path: '/' });

  return response;
}
