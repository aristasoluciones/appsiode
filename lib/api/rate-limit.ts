/**
 * Lectura del bloqueo temporal por exceso de intentos (HTTP 429).
 *
 * El API corta los intentos de dos maneras —por origen de internet y por
 * cuenta— y en ambos casos responde 429 con el mensaje para el usuario y la
 * cabecera `Retry-After` con los segundos que faltan para reintentar.
 */

export interface IBloqueoIntentos {
  /** Aviso que devolvió el API explicando el motivo del corte. */
  mensaje: string;
  /** Momento (epoch ms) a partir del cual se puede volver a intentar. */
  hasta: number;
}

const MENSAJE_POR_OMISION =
  'Demasiados intentos. Espera un momento e inténtalo de nuevo.';

/** Espera que se asume cuando el API no informa cuánto falta. */
const ESPERA_POR_OMISION = 60;

/**
 * Devuelve el bloqueo cuando el error es un 429; `null` en cualquier otro caso.
 */
export function getBloqueoIntentos(error: unknown): IBloqueoIntentos | null {
  const respuesta = (
    error as {
      response?: {
        status?: number;
        data?: { message?: string };
        headers?: Record<string, unknown> | { get?: (name: string) => unknown };
      };
    }
  )?.response;

  if (respuesta?.status !== 429) return null;

  const mensaje = respuesta.data?.message?.trim() || MENSAJE_POR_OMISION;

  return {
    mensaje,
    hasta: Date.now() + segundosDeEspera(respuesta.headers, mensaje) * 1000,
  };
}

/**
 * Segundos de espera: primero la cabecera `Retry-After` y, si el navegador no
 * la deja leer, el tiempo que el propio mensaje del API menciona.
 */
function segundosDeEspera(headers: unknown, mensaje: string): number {
  const cabecera = leerCabecera(headers, 'retry-after');
  const segundos = Number(cabecera);
  if (Number.isFinite(segundos) && segundos > 0) return Math.ceil(segundos);

  return segundosDelMensaje(mensaje) ?? ESPERA_POR_OMISION;
}

function leerCabecera(headers: unknown, nombre: string): string | null {
  if (!headers || typeof headers !== 'object') return null;

  const conGet = headers as { get?: (name: string) => unknown };
  if (typeof conGet.get === 'function') {
    const valor = conGet.get(nombre);
    if (valor !== null && valor !== undefined) return String(valor);
  }

  const plano = headers as Record<string, unknown>;
  const valor = plano[nombre] ?? plano[nombre.toUpperCase()];
  return valor === null || valor === undefined ? null : String(valor);
}

/** Rescata «Espera 5 minutos» / «30 segundos» del texto del API. */
function segundosDelMensaje(mensaje: string): number | null {
  const coincidencia = mensaje.match(/(\d+)\s*(segundo|minuto|hora)/i);
  if (!coincidencia) return null;

  const cantidad = Number(coincidencia[1]);
  if (!Number.isFinite(cantidad) || cantidad <= 0) return null;

  const unidad = coincidencia[2].toLowerCase();
  if (unidad === 'minuto') return cantidad * 60;
  if (unidad === 'hora') return cantidad * 3600;
  return cantidad;
}

/** Formatea los segundos restantes como `m:ss` para la cuenta regresiva. */
export function formatoRestante(segundos: number): string {
  const total = Math.max(0, Math.ceil(segundos));
  const minutos = Math.floor(total / 60);
  return `${minutos}:${String(total % 60).padStart(2, '0')}`;
}
