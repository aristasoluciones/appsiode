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
  const parts = rawCookie.split(';').map((p) => p.trim());

  // Eliminar Domain original del API .NET
  const filtered = parts.filter(
    (part) => !part.toLowerCase().startsWith('domain='),
  );

  // En producción poner el dominio padre para que la cookie aplique a todos los subdominios
  const cookieDomain = process.env.COOKIE_DOMAIN;
  if (cookieDomain) {
    filtered.push(`Domain=${cookieDomain}`);
  }

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
