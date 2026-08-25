/**
 * Encabezados de seguridad fijos del sitio (no dependen de la petición).
 * Se aplican a toda respuesta desde `next.config.mjs`. La política de contenido
 * y el `Cache-Control` de las pantallas protegidas viven en `middleware.ts`,
 * junto con `lib/security/headers.ts`.
 */

/** Encabezados fijos, iguales para toda respuesta del sitio. */
export const ENCABEZADOS_FIJOS = [
  // Ninguna página ajena puede incrustar el sitio en un marco.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // El navegador no adivina el tipo de archivo: respeta el Content-Type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Al salir a otro dominio solo se comparte el origen, nunca la ruta.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Aislamiento del contexto de navegación y de los recursos propios.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  // Sin políticas entre dominios heredadas (Flash/Acrobat).
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  // HTTPS obligatorio por un año, subdominios incluidos.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  // Permisos del navegador: solo la ubicación, y únicamente para este sitio.
  {
    key: 'Permissions-Policy',
    value: [
      'geolocation=(self)',
      'camera=()',
      'microphone=()',
      'accelerometer=()',
      'gyroscope=()',
      'magnetometer=()',
      'payment=()',
      'usb=()',
    ].join(', '),
  },
  // No se agregan a propósito:
  // - X-XSS-Protection: obsoleto y hoy desaconsejado.
  // - Cross-Origin-Embedder-Policy: rompería las previsualizaciones de PDF
  //   servidas desde el almacenamiento de Azure.
];
