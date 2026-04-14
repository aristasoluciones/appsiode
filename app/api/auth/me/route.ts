import { NextRequest, NextResponse } from 'next/server';
import type { AuthUser } from '@/types/auth';

// .NET claim type URIs
const CLAIM_NAME_ID =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const CLAIM_NAME =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const CLAIM_ROLE =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

/**
 * El claim "modulos" puede llegar como:
 *  - Array:   ["SESIONES","USUARIOS"]
 *  - String:  "SESIONES,USUARIOS"
 *  - Ausente: undefined / null
 */
function parseModulos(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map((m) => m.trim()).filter(Boolean);
  return [];
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('AccessToken')?.value;

  if (!accessToken) {
    return NextResponse.json(
      { status: 401, message: 'No autenticado', data: null },
      { status: 401 },
    );
  }

  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT');
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8'),
    );

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return NextResponse.json(
        { status: 401, message: 'Token expirado', data: null },
        { status: 401 },
      );
    }

    const user: AuthUser = {
      id: payload[CLAIM_NAME_ID] || payload.sub || '',
      nombre: payload[CLAIM_NAME] || payload.name || '',
      email: payload.email || '',
      rol: payload[CLAIM_ROLE] || payload.role || '',
      idRol: payload.id_rol || '',
      idProceso: payload.id_proceso || '',
      idConsejo: payload.id_consejo || '',
      tipoConsejo: payload.tipo_consejo || '',
      tipoConsejoDesc: payload.tipo_consejo_desc || '',
      claveConsejo: payload.clave_consejo || '',
      consejo: payload.consejo || '',
      modulos: parseModulos(payload.modulos),
    };

    return NextResponse.json({ status: 200, message: 'OK', data: user });
  } catch {
    return NextResponse.json(
      { status: 401, message: 'Token inválido', data: null },
      { status: 401 },
    );
  }
}
