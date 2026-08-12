// Utilidades compartidas por los módulos de endpoints.

/** Identificador aceptado por las rutas del API. */
export type Id = string | number;

/**
 * Arma un query string omitiendo valores nulos, indefinidos o vacíos.
 * Devuelve '' cuando no hay parámetros, o '?a=1&b=2'.
 */
export function qs(params: Record<string, Id | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}
