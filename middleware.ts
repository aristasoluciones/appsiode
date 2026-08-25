import { NextRequest, NextResponse } from 'next/server';
import { construirCsp, nombreEncabezadoCsp } from '@/lib/security/headers';

/** Pantallas que se ven sin sesión iniciada. */
const RUTAS_PUBLICAS = [
  '/signin',
  '/signup',
  '/reset-password',
  '/change-password',
  '/verify-email',
];

function decodeJwtPayload(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT');
  }

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  return JSON.parse(atob(padded));
}

function resolveAccessToken(request: NextRequest) {
  return (
    request.cookies.get('AccessToken')?.value ||
    request.cookies.get('accessToken')?.value ||
    request.cookies.get('access_token')?.value ||
    request.cookies.get('token')?.value
  );
}

/** Valor único por petición que firma los scripts en línea de la página. */
function generarNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));
}

function esRutaPublica(pathname: string) {
  return RUTAS_PUBLICAS.some(
    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
  );
}

/** Sesión válida: hay token y todavía no expira. */
function tieneSesionVigente(request: NextRequest) {
  const accessToken = resolveAccessToken(request);
  if (!accessToken) return false;

  // Check JWT expiration without full validation
  try {
    const payload = decodeJwtPayload(accessToken);
    return !(payload.exp && Date.now() >= payload.exp * 1000);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publica = esRutaPublica(pathname);
  const nonce = generarNonce();
  const csp = construirCsp(nonce);

  // El nonce viaja en la petición para que Next firme con él sus propios
  // scripts en línea y el layout se lo pase al cambio de tema.
  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set(nombreEncabezadoCsp(), csp);

  const responder = () => {
    if (publica) return NextResponse.next({ request: { headers } });

    const signinUrl = request.nextUrl.clone();
    signinUrl.pathname = `${request.nextUrl.basePath || ''}/signin`;
    signinUrl.search = '';
    signinUrl.searchParams.set('callbackUrl', pathname);

    if (!tieneSesionVigente(request)) return NextResponse.redirect(signinUrl);

    return NextResponse.next({ request: { headers } });
  };

  const response = responder();

  response.headers.set(nombreEncabezadoCsp(), csp);

  // En equipos compartidos de los consejos, ninguna pantalla con datos debe
  // quedar recuperable con el botón atrás después de cerrar sesión. Los
  // archivos estáticos no pasan por aquí y conservan su caché larga.
  if (!publica) {
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }

  return response;
}

export const config = {
  matcher: [
    // Todo salvo los archivos estáticos: las pantallas públicas también
    // necesitan la política de contenido, aunque no exijan sesión.
    '/((?!_next/static|_next/image|favicon\.ico|media).*)',
  ],
};
