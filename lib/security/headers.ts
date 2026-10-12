/**
 * Encabezados de seguridad del sitio.
 *
 * Se reparten en dos lugares porque tienen naturaleza distinta:
 * - Los fijos (no dependen de la petición) se declaran en `next.config.mjs`
 *   desde `lib/security/headers-fijos.mjs`.
 * - La política de contenido (CSP) y el `Cache-Control` de las pantallas
 *   protegidas se emiten en `middleware.ts`, porque necesitan un valor único
 *   por petición (el nonce).
 *
 * Orígenes externos: RPP y SICE ya no se consultan desde el navegador, sino
 * desde el API, así que las consultas (`connect-src`) solo van al propio sitio
 * y al API. Las imágenes (logos de partidos y archivos de Azure) y los marcos
 * de PDF siguen aceptando cualquier origen HTTPS porque sus dominios vienen de
 * la base de datos y pueden cambiar sin volver a compilar. Lo que sí queda
 * cerrado es lo que de verdad protege contra inyección: solo se ejecutan scripts propios
 * firmados con el nonce, no hay objetos incrustados y ninguna página ajena
 * puede enmarcar el sitio.
 */

/** `true` cuando la política debe bloquear; `false` mientras solo reporta. */
export function cspBloquea(): boolean {
  return (process.env.CSP_MODO ?? 'reporte').toLowerCase() === 'bloqueo';
}

/** Nombre del encabezado según el modo configurado. */
export function nombreEncabezadoCsp(): string {
  return cspBloquea()
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only';
}

/**
 * Arma la política de contenido de la petición.
 * El nonce firma los scripts en línea que genera Next y el del cambio de tema.
 */
export function construirCsp(nonce: string): string {
  const esDesarrollo = process.env.NODE_ENV !== 'production';
  const reporte = process.env.CSP_REPORT_URI?.trim();

  // En desarrollo, Next necesita eval y conexiones de recarga en caliente;
  // el API local corre en https con certificado propio.
  const scriptDesarrollo = esDesarrollo
    ? ["'unsafe-eval'", "'unsafe-inline'"]
    : [];
  const conexionDesarrollo = esDesarrollo ? ['ws:', 'wss:'] : [];
  // Origen del API; si la variable falta o no es una URL, se permite cualquier HTTPS
  // para no romper las consultas.
  const origenApi = (() => {
    try {
      return [new URL(process.env.NEXT_PUBLIC_API_URL ?? '').origin];
    } catch {
      return ['https:'];
    }
  })();

  const directivas: Record<string, string[]> = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'form-action': ["'self'"],
    // El sitio solo puede incrustarse a sí mismo (previsualizaciones de PDF).
    'frame-ancestors': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...scriptDesarrollo,
    ],
    // Los estilos en línea los generan las gráficas y la plantilla.
    'style-src': ["'self'", "'unsafe-inline'"],
    // Imágenes de representantes (RPP) y archivos de Azure: cualquier HTTPS.
    'img-src': ["'self'", 'https:', 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    // Solo el propio sitio y el API .NET; RPP y SICE los consulta el API.
    'connect-src': ["'self'", ...origenApi, ...conexionDesarrollo],
    // Marcos de previsualización de PDF: Azure y archivos temporales.
    'frame-src': ["'self'", 'https:', 'blob:', 'data:'],
    'worker-src': ["'self'", 'blob:'],
    'media-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
  };

  const partes = Object.entries(directivas).map(
    ([directiva, valores]) => `${directiva} ${valores.join(' ')}`,
  );

  if (!esDesarrollo) partes.push('upgrade-insecure-requests');
  if (reporte) partes.push(`report-uri ${reporte}`);

  return partes.join('; ');
}
