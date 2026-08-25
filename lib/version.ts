/**
 * Versión de la aplicación.
 *
 * - `APP_VERSION`: semver puro que vive en `package.json` (2.0.0). Se sube con
 *   `npm run version:patch | version:minor | version:major`.
 * - `BUILD_STAMP`: sello de la compilación, inyectado por `next.config.mjs`
 *   (`cYYMMDD[.run][.sha]`). Cambia en cada build de Azure aunque la versión
 *   semántica no se mueva.
 * - `APP_VERSION_FULL`: lo que se muestra al usuario, ej. `v2.0.0+c260825.42.a1b2c3d`.
 */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';

export const BUILD_STAMP = process.env.NEXT_PUBLIC_BUILD_STAMP ?? 'local';

export const APP_VERSION_FULL = `v${APP_VERSION}+${BUILD_STAMP}`;
