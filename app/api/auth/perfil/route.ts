import { NextRequest, NextResponse } from 'next/server';
import serverApi from '@/lib/api/server-axios';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { AuthUser } from '@/types/auth';
import type { IProceso } from '@/types/proceso';

function parseModulos(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map((m) => m.trim()).filter(Boolean);
  return [];
}

/**
 * Mapea la respuesta snake_case de la API .NET al shape AuthUser (camelCase).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToAuthUser(d: Record<string, any>): AuthUser {
  return {
    id:              String(d.id            ?? ''),
    nombre:          d.nombre              ?? '',
    email:           d.email ?? d.usuario  ?? '',
    rol:             d.rol   ?? d.role     ?? '',
    idRol:           String(d.id_rol       ?? ''),
    idProceso:       String(d.id_proceso   ?? ''),
    idConsejo:       String(d.id_consejo   ?? ''),
    tipoConsejo:     d.tipo_consejo        ?? '',
    tipoConsejoDesc: d.tipo_consejo_desc   ?? '',
    claveConsejo:    d.clave_consejo       ?? '',
    consejo:         d.consejo             ?? '',
    modulos:         parseModulos(d.modulos),
  };
}

/**
 * GET /api/auth/perfil
 * Proxy BFF → GET /Auth/perfil
 * Devuelve AuthUser con módulos frescos desde la API .NET.
 */
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('AccessToken')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { status: 401, message: 'No autenticado', data: null },
      { status: 401 },
    );
  }

  try {
    const apiResponse = await serverApi.get(API_ENDPOINTS.AUTH.PERFIL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (apiResponse.status !== 200 || !apiResponse.data?.data) {
      return NextResponse.json(apiResponse.data, { status: apiResponse.status });
    }

    const user = mapToAuthUser(apiResponse.data.data);

    // Fetch proceso en paralelo server-to-server — sin cookies browser, sin CORS
    let proceso: IProceso | null = null;
    if (user.idProceso) {
      try {
        const procesoRes = await serverApi.get(
          API_ENDPOINTS.CATALOGOS.PROCESO(user.idProceso),
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (procesoRes.status === 200 && procesoRes.data?.data) {
          proceso = procesoRes.data.data as IProceso;
        }
      } catch {
        // proceso queda null — no bloquea el login
      }
    }

    return NextResponse.json(
      { status: 200, message: 'OK', data: { ...user, proceso } },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { status: 500, message: 'Error al obtener perfil', data: null },
      { status: 500 },
    );
  }
}
