import type {
  TCedulaEstatus,
  TTipoConsejoChar,
  TTipoMecanismo,
} from '@/types/mecanismos';

type TVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'info'
  | 'destructive';

/** Etiqueta y color de cada estatus de la cédula, iguales en listas y detalles. */
export const ESTATUS_CEDULA: Record<
  TCedulaEstatus,
  { label: string; variant: TVariant }
> = {
  SIN_CEDULA: { label: 'Sin cédula', variant: 'secondary' },
  PROPUESTA: { label: 'Propuesta', variant: 'primary' },
  INFORMADA: { label: 'Informada', variant: 'info' },
  APROBADA: { label: 'Aprobada', variant: 'warning' },
  CERRADA: { label: 'Cerrada', variant: 'success' },
  ANULADA: { label: 'Anulada', variant: 'destructive' },
};

/** Nombre corto del tipo de mecanismo para tablas y tarjetas. */
export const TIPO_MECANISMO_CORTO: Record<TTipoMecanismo, string> = {
  DAT: 'DAT',
  CRYT_FIJO: 'CRyT fijo',
  CRYT_ITINERANTE: 'CRyT itinerante',
};

/** «Distrital 12» / «Municipal 45», para el consejo que informa o cotiza. */
export function nombreConsejo(
  tipo: TTipoConsejoChar | null | undefined,
  id: number | null | undefined,
  nombre?: string | null,
): string {
  if (!tipo || !id) return '—';
  const etiqueta = tipo === 'D' ? 'Distrital' : 'Municipal';
  return nombre ? `${etiqueta} ${id}. ${nombre}` : `${etiqueta} ${id}`;
}

/** «DF01 · DAT 3»: identidad del mecanismo según la numeración del INE. */
export function claveMecanismo(m: {
  id_df: number;
  tipo: TTipoMecanismo;
  numero: number;
}): string {
  return `DF${String(m.id_df).padStart(2, '0')} · ${TIPO_MECANISMO_CORTO[m.tipo]} ${m.numero}`;
}

/**
 * Agrupa «954 B1, 954 C1, 1002 B1» por sección: [{ seccion: '954', tipos:
 * ['B1', 'C1'] }, { seccion: '1002', tipos: ['B1'] }], conservando el orden.
 */
export function agruparCasillas(
  texto: string | null | undefined,
): { seccion: string; tipos: string[] }[] {
  const grupos: { seccion: string; tipos: string[] }[] = [];
  for (const casilla of (texto ?? '').split(',')) {
    const [seccion, ...tipo] = casilla.trim().split(' ');
    if (!seccion) continue;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.seccion === seccion) ultimo.tipos.push(tipo.join(' '));
    else grupos.push({ seccion, tipos: [tipo.join(' ')] });
  }
  return grupos;
}
