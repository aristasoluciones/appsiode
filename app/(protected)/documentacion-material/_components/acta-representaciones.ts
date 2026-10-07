/**
 * Orden de las representaciones de partido en el acta: por partido (en el orden
 * de registro del RPP) y, dentro de cada partido, la propietaria antes que la
 * suplente. El API guarda el orden en que llega la lista, así que el documento
 * y el detalle lo conservan.
 */

interface IRepresentacionOrdenable {
  id_partido?: number | null;
  partido?: string | null;
  cargo?: string | null;
}

function rangoCargo(cargo: string | null | undefined) {
  if (/propietari/i.test(cargo ?? '')) return 0;
  if (/suplente/i.test(cargo ?? '')) return 1;
  return 2;
}

export function ordenarRepresentaciones<T extends IRepresentacionOrdenable>(
  lista: T[],
): T[] {
  return [...lista].sort(
    (a, b) =>
      (a.id_partido ?? Number.MAX_SAFE_INTEGER) -
        (b.id_partido ?? Number.MAX_SAFE_INTEGER) ||
      (a.partido ?? '').localeCompare(b.partido ?? '', 'es') ||
      rangoCargo(a.cargo) - rangoCargo(b.cargo),
  );
}

/** «PAN · Propietario»; solo el partido si no hay cargo. */
export function subtituloRepresentacion(
  partido: string | null | undefined,
  cargo: string | null | undefined,
) {
  return [partido?.trim(), cargo?.trim()].filter(Boolean).join(' · ');
}
