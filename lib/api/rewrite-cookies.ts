/**
 * Reescribe las cookies que vienen de la API externa (.NET) para que sean
 * válidas en el dominio del BFF (Next.js).
 *
 * Problemas que resuelve:
 * - `Domain=api.example.com` → el browser rechaza la cookie porque no coincide
 *   con el dominio del BFF. En modo incógnito el rechazo es estricto.
 * - `Secure` sin HTTPS en desarrollo → browser descarta la cookie.
 * - `SameSite=None` sin `Secure` → inválido en navegadores modernos.
 */
export function rewriteCookieForBFF(rawCookie: string): string {
  // Solo eliminar el atributo Domain para que el browser asigne el dominio
  // del BFF (Next.js) en lugar del dominio de la API externa.
  // Dejamos SameSite=None y Secure intactos: son necesarios para que el browser
  // reenvíe las cookies en peticiones cross-site a la API .NET.
  // Chrome permite cookies Secure en localhost desde v89 (excepción especial).
  const parts = rawCookie.split(';').map((p) => p.trim());
  const filtered = parts.filter((part) => !part.toLowerCase().startsWith('domain='));
  return filtered.join('; ');
}

/**
 * Aplica rewriteCookieForBFF a todos los Set-Cookie del response del API externo
 * y los añade al NextResponse del BFF.
 */
export function forwardCookies(
  response: import('next/server').NextResponse,
  setCookies: string | string[] | undefined,
): void {
  if (!setCookies) return;
  const list = Array.isArray(setCookies) ? setCookies : [setCookies];
  for (const cookie of list) {
    response.headers.append('Set-Cookie', rewriteCookieForBFF(cookie));
  }
}
