import https from 'node:https';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { IProceso } from '@/types/proceso';

/**
 * Proxy temporal a SICE: ese sistema todavía no acepta CORS, así que la
 * consulta se hace servidor→servidor. El enlace NO viene de una variable de
 * build: se toma de la configuración del proceso del usuario autenticado, igual
 * que en el navegador. Cuando SICE acepte CORS, la llamada será directa desde
 * el front y esta ruta desaparece.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/** Caché en memoria del enlace por proceso, para no consultar el API en cada petición. */
const CACHE_TTL_MS = 5 * 60_000;
const enlaceCache = new Map<number, { url: string; expira: number }>();

/**
 * En desarrollo el API corre con el certificado autofirmado de .NET, que Node
 * rechaza (a diferencia del navegador, donde ya lo confiaste). Solo en ese caso
 * —y nunca en producción ni para la llamada a SICE— se relaja la verificación.
 */
const esApiLocal = /^https:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(API_URL);
const agenteApiLocal =
  process.env.NODE_ENV !== 'production' && esApiLocal
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

function leerAccessToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get('AccessToken')?.value ||
    request.cookies.get('accessToken')?.value ||
    request.cookies.get('access_token')?.value ||
    request.cookies.get('token')?.value
  );
}

/** Lee el id del proceso del JWT. El API vuelve a validar el token en su llamada. */
function leerIdProceso(token: string): number | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload = JSON.parse(
      Buffer.from(padded, 'base64').toString('utf8'),
    ) as Record<string, unknown>;
    const id = Number(payload.id_proceso);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

async function resolverEnlaceSice(
  idProceso: number,
  cookie: string,
): Promise<string | null> {
  const enCache = enlaceCache.get(idProceso);
  if (enCache && enCache.expira > Date.now()) return enCache.url;

  // axios (y no apiClient) porque esta llamada sale del servidor de Next: hay
  // que reenviar a mano las cookies del usuario y, en local, aceptar el
  // certificado de desarrollo del API.
  const res = await axios.get<{ data?: IProceso | null }>(
    `${API_URL}${API_ENDPOINTS.CATALOGOS.PROCESO(idProceso)}`,
    {
      headers: { Accept: 'application/json', Cookie: cookie },
      httpsAgent: agenteApiLocal,
      validateStatus: () => true,
    },
  );

  if (res.status < 200 || res.status >= 300) return null;

  const enlace = res.data?.data?.configuracion?.sice_api_base?.replace(/\/+$/, '');
  if (!enlace) return null;

  enlaceCache.set(idProceso, { url: enlace, expira: Date.now() + CACHE_TTL_MS });
  return enlace;
}

export async function GET(request: NextRequest) {
  const token = leerAccessToken(request);
  const idProceso = token ? leerIdProceso(token) : null;

  if (!token || idProceso === null) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }

  if (!API_URL) {
    return NextResponse.json(
      { error: 'El servidor no tiene configurada la dirección del API.' },
      { status: 500 },
    );
  }

  let base: string | null;
  try {
    base = await resolverEnlaceSice(idProceso, request.headers.get('cookie') ?? '');
  } catch {
    return NextResponse.json(
      { error: 'No se pudo obtener el enlace del sistema SICE del proceso activo.' },
      { status: 502 },
    );
  }

  if (!base) {
    return NextResponse.json(
      { error: 'El proceso activo no tiene configurado el enlace al sistema SICE.' },
      { status: 503 },
    );
  }

  let response: Response;
  try {
    response = await fetch(`${base}/Public/GetIntegracion`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo establecer contacto con el sistema SICE.' },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Error al consultar SICE', status: response.status },
      { status: response.status },
    );
  }

  try {
    const responseJson = await response.json();
    return NextResponse.json(responseJson?.data, {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'El sistema SICE devolvió una respuesta que no se pudo leer.' },
      { status: 502 },
    );
  }
}
