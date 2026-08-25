import { readFileSync } from 'node:fs';

import { ENCABEZADOS_FIJOS } from './lib/security/headers-fijos.mjs';

/** Versión semántica declarada en package.json (la que sube `npm run version:*`). */
const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);

/**
 * Sello de compilación: `cYYMMDD[.run][.sha]` (ej. `c260825.42.a1b2c3d`).
 * La fecha se calcula en zona horaria de México para que coincida con el día
 * real del despliegue aunque el runner de GitHub Actions corra en UTC.
 */
function getBuildStamp() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );

  const parts = [`c${p.year}${p.month}${p.day}`];

  if (process.env.GITHUB_RUN_NUMBER) parts.push(process.env.GITHUB_RUN_NUMBER);
  if (process.env.GITHUB_SHA) parts.push(process.env.GITHUB_SHA.slice(0, 7));
  if (!process.env.GITHUB_SHA && !process.env.GITHUB_RUN_NUMBER)
    parts.push('local');

  return parts.join('.');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript and ESLint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Versión y sello de compilación disponibles en cliente y servidor
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_BUILD_STAMP: getBuildStamp(),
  },

  // Base path for production deployment behind nginx proxy
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Asset prefix for static assets
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Disable the floating Next.js dev indicator
  devIndicators: false,

  /**
   * Encabezados de seguridad fijos para toda respuesta del sitio. La política
   * de contenido (CSP) y el Cache-Control de las pantallas protegidas se
   * emiten en `middleware.ts`, porque dependen de cada petición.
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: ENCABEZADOS_FIJOS,
      },
    ];
  },
};

export default nextConfig;
