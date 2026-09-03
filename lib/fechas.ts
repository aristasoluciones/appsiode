/**
 * Fecha y hora en español para las pantallas del sistema. La API entrega
 * marcas de tiempo sin zona (hora del servidor): se muestran tal cual, sin
 * convertir, para que coincidan con lo que registró el sistema.
 */

/** Abreviaturas del mes, fijas: no dependen del idioma del navegador. */
const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/** Convierte la marca de tiempo del API a una fecha local, sin desplazarla. */
function aFecha(input: string): Date {
  const m = input.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  return m
    ? new Date(
        Number(m[1]),
        Number(m[2]) - 1,
        Number(m[3]),
        Number(m[4]),
        Number(m[5]),
        Number(m[6] ?? 0),
      )
    : new Date(input);
}

/** Formato del sistema: «05 may 2026 01:27 AM». */
export function formatFechaHora(input: string | null | undefined): string {
  if (!input) return '—';

  const fecha = aFecha(input);
  if (Number.isNaN(fecha.getTime())) return '—';

  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = MESES[fecha.getMonth()];
  const anio = fecha.getFullYear();

  const horas = fecha.getHours();
  const meridiano = horas < 12 ? 'AM' : 'PM';
  const hora12 = String(horas % 12 || 12).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');

  return `${dia} ${mes} ${anio} ${hora12}:${minutos} ${meridiano}`;
}
