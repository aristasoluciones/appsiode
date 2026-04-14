import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/lib/api/server-axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { forwardCookies } from '@/lib/api/rewrite-cookies';

/**
 * POST /api/auth/refresh
 * Proxea al endpoint /Auth/refresh de la API .NET.
 * El browser envía la cookie RefreshToken automáticamente.
 * La API devuelve nuevo AccessToken vía Set-Cookie + datos del usuario.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('RefreshToken')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { status: 401, message: 'No hay sesión activa', data: null },
      { status: 401 },
    );
  }

  try {
    const apiResponse = await serverApi.post(
      API_ENDPOINTS.AUTH.REFRESH,
      {},
      { headers: { Cookie: `RefreshToken=${refreshToken}` } },
    );

    const response = NextResponse.json(apiResponse.data, {
      status: apiResponse.status,
    });

    // Reenviar Set-Cookie al browser (nuevo AccessToken y RefreshToken)
    const setCookies = apiResponse.headers['set-cookie'];
    if (setCookies) {
      for (const cookie of setCookies) {
        response.headers.append('Set-Cookie', cookie);
      }
    }
    
    return response;
  } catch {
    return NextResponse.json(
      { status: 401, message: 'Sesión expirada', data: null },
      { status: 401 },
    );
  }
}
