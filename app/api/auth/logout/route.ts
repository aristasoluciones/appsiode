import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/lib/api/server-axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('AccessToken')?.value;
  let responseServer;
  // Invalidar el token en el backend .NET aunque falle no bloqueamos el logout local
  if (accessToken) {
    try {
        responseServer = await serverApi.post(API_ENDPOINTS.AUTH.LOGOUT, null, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // ignorar — continuamos limpiando cookies locales
    }
  }

  const response = NextResponse.json(
    { status: 200, message: responseServer?.data?.message || 'Sesión cerrada', data: null },
    { status: 200 },
  );

  const cookieDomain = process.env.COOKIE_DOMAIN;
  const cookieOptions = {
    maxAge: 0,
    path: '/',
    ...(cookieDomain && { domain: cookieDomain }),
  };

  response.cookies.set('AccessToken', '', cookieOptions);
  response.cookies.set('RefreshToken', '', cookieOptions);
  response.cookies.set('X-CSRF-TOKEN', '', cookieOptions);

  return response;
}
