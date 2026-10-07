/** Textos de cantidades de la comprobación: «1,450 piezas», «en 3 paquetes o cajas». */

import { formatNumero } from '@/lib/helpers';

export function piezas(cantidad: number | null) {
  return `${formatNumero(cantidad ?? 0)} ${cantidad === 1 ? 'pieza' : 'piezas'}`;
}

/** «en 3 paquetes o cajas»; vacío cuando el layout no trajo el dato. */
export function enPaquetesCajas(paquetes: number | null | undefined) {
  if (paquetes == null || paquetes < 1) return '';
  return `en ${formatNumero(paquetes)} ${paquetes === 1 ? 'paquete o caja' : 'paquetes o cajas'}`;
}

/** «1,450 piezas en 3 cajas» o solo «1,450 piezas» si no hay paquetes. */
export function piezasConPaquetes(
  cantidad: number | null,
  paquetes: number | null | undefined,
) {
  const sufijo = enPaquetesCajas(paquetes);
  return sufijo ? `${piezas(cantidad)} ${sufijo}` : piezas(cantidad);
}

/** Diferencia con signo y separador de miles: «+1,200», «-35», «0». */
export function diferenciaConSigno(valor: number) {
  return valor > 0 ? `+${formatNumero(valor)}` : formatNumero(valor);
}
