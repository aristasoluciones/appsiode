import type {
  TEstudioEstatus,
  TMecanismoEstatus,
  TObservacionTipo,
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

/** Etiqueta y color del estatus del mecanismo, iguales en listas y detalles. */
export const ESTATUS_MECANISMO: Record<
  TMecanismoEstatus,
  { label: string; variant: TVariant }
> = {
  SIN_INFORMAR: { label: 'Sin informar', variant: 'secondary' },
  INFORMADO: { label: 'Informado', variant: 'success' },
};

/** Tipo de observación con el que se informa el mecanismo; es el único que habilita el check. */
export const TIPO_SIN_OBSERVACIONES: TObservacionTipo = 'SIN_OBSERVACIONES';

/** Ayuda de los tipos que la necesitan, bajo el combo del informe. */
export const AYUDA_TIPO_OBSERVACION: Partial<Record<TObservacionTipo, string>> =
  {
    RUTA: 'Tiempo, distancia y vía del traslado: terrestre, aérea o marítima.',
  };

/** Etiqueta corta de cada tipo de observación, para la lista cuando el catálogo aún no carga. */
export const TIPO_OBSERVACION_CORTO: Record<TObservacionTipo, string> = {
  SIN_OBSERVACIONES: 'Sin observaciones',
  COSTO: 'Costo',
  DOMICILIO: 'Domicilio',
  DESTINO: 'Destino',
  CASILLA_SECCION: 'Casilla / sección',
  RUTA: 'Ruta',
};

/** Etiqueta y color de cada estatus del estudio de factibilidad; «Sin estudio» cubre el distrito sin propuesta. */
export const ESTATUS_ESTUDIO: Record<
  TEstudioEstatus | 'SIN_ESTUDIO',
  { label: string; variant: TVariant }
> = {
  SIN_ESTUDIO: { label: 'Sin estudio', variant: 'secondary' },
  PROPUESTO: { label: 'Propuesto', variant: 'primary' },
  APROBADO: { label: 'Aprobado', variant: 'warning' },
  CERRADO: { label: 'Cerrado', variant: 'success' },
  ANULADO: { label: 'Anulado', variant: 'destructive' },
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
