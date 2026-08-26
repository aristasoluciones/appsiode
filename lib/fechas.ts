/**
 * Fecha y hora en español para las pantallas del sistema. La API entrega
 * marcas de tiempo sin zona (hora del servidor): se muestran tal cual, sin
 * convertir, para que coincidan con lo que registró el sistema.
 */
export function formatFechaHora(input: string | null | undefined): string {
  if (!input) return '—';
  const m = input.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  const fecha = m
    ? new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        Number(m[4]),
        Number(m[5]),
        Number(m[6] ?? 0),
      )
    : new Date(input);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
