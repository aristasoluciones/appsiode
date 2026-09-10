/** Textos de cantidades de la comprobación: «450 piezas», «en 3 paquetes o cajas». */

export function piezas(cantidad: number | null) {
  return `${cantidad ?? 0} ${cantidad === 1 ? 'pieza' : 'piezas'}`;
}

/** «en 3 paquetes o cajas»; vacío cuando el layout no trajo el dato. */
export function enPaquetesCajas(paquetes: number | null | undefined) {
  if (paquetes == null || paquetes < 1) return '';
  return `en ${paquetes} ${paquetes === 1 ? 'paquete o caja' : 'paquetes o cajas'}`;
}

/** «450 piezas en 3 cajas» o solo «450 piezas» si no hay paquetes. */
export function piezasConPaquetes(
  cantidad: number | null,
  paquetes: number | null | undefined,
) {
  const sufijo = enPaquetesCajas(paquetes);
  return sufijo ? `${piezas(cantidad)} ${sufijo}` : piezas(cantidad);
}
