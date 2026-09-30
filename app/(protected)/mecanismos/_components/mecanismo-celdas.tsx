'use client';

import { FileText } from 'lucide-react';
import type { IMecanismoLista } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { formatMoneda } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import {
  agruparCasillas,
  ESTATUS_MECANISMO,
  TIPO_OBSERVACION_CORTO,
} from '../_lib/estatus';

/** Estatus del mecanismo según el consejo que lo informa. */
export function InformeBadge({
  m,
}: {
  m: Pick<IMecanismoLista, 'estatus' | 'estatus_desc'>;
}) {
  const e = ESTATUS_MECANISMO[m.estatus];
  return (
    <Badge variant={e?.variant ?? 'secondary'} appearance="light" size="sm">
      {e?.label ?? m.estatus_desc}
    </Badge>
  );
}

/** Indica si el mecanismo ya tiene su PDF de cédula. */
export function CedulaBadge({
  m,
}: {
  m: Pick<IMecanismoLista, 'tiene_cedula' | 'cedula_fecha'>;
}) {
  return (
    <Badge
      variant={m.tiene_cedula ? 'info' : 'secondary'}
      appearance="light"
      size="sm"
      title={
        m.tiene_cedula && m.cedula_fecha
          ? `Cargada ${formatFechaHora(m.cedula_fecha)}`
          : undefined
      }
    >
      <FileText className="h-3 w-3" aria-hidden="true" />
      {m.tiene_cedula ? 'Con cédula' : 'Sin cédula'}
    </Badge>
  );
}

/** Total de observaciones y tipo de la última, con su fecha. */
export function ObservacionesTexto({
  m,
}: {
  m: Pick<
    IMecanismoLista,
    | 'total_observaciones'
    | 'ultima_observacion_tipo'
    | 'ultima_observacion_fecha'
  >;
}) {
  if (m.total_observaciones === 0) {
    return <span className="text-sm text-muted-foreground">Ninguna</span>;
  }
  return (
    <div>
      <p className="text-sm text-foreground leading-tight tabular-nums">
        {m.total_observaciones}{' '}
        {m.total_observaciones === 1 ? 'observación' : 'observaciones'}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        Última:{' '}
        {m.ultima_observacion_tipo
          ? TIPO_OBSERVACION_CORTO[m.ultima_observacion_tipo]
          : '—'}
        {m.ultima_observacion_fecha &&
          ` · ${formatFechaHora(m.ultima_observacion_fecha)}`}
      </p>
    </div>
  );
}

/** Folio y nombre del CAE congelado en el mecanismo; avisa si ya no está activo. */
export function CaeTexto({
  m,
}: {
  m: Pick<IMecanismoLista, 'cae_folio' | 'cae_nombre' | 'cae_activo'>;
}) {
  if (!m.cae_folio) {
    return <span className="text-sm text-muted-foreground">Sin CAE</span>;
  }
  return (
    <div>
      <p className="text-sm text-foreground leading-tight">{m.cae_nombre}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        Folio {m.cae_folio}
        {m.cae_activo === false && (
          <span className="text-warning"> · ya no está activo</span>
        )}
      </p>
    </div>
  );
}

/** Importe en pesos o «Sin capturar»: un cero se leería como un costo real. */
function importe(valor: number | null) {
  return valor == null ? (
    <span className="text-muted-foreground italic">Sin capturar</span>
  ) : (
    formatMoneda(valor)
  );
}

/**
 * Costo del mecanismo. El consejo ve el que captura; oficina central ve el
 * costo INE de referencia y el del consejo.
 */
export function CostoTexto({
  m,
  modo,
}: {
  m: Pick<IMecanismoLista, 'costo_ine' | 'costo_estimado'>;
  modo: 'consejo' | 'admin';
}) {
  if (modo === 'consejo') {
    return (
      <span className="text-sm text-foreground tabular-nums">
        {importe(m.costo_estimado)}
      </span>
    );
  }
  return (
    <div className="tabular-nums text-xs leading-tight space-y-0.5">
      <p className="text-muted-foreground">
        INE <span className="text-foreground">{importe(m.costo_ine)}</span>
      </p>
      <p className="text-muted-foreground">
        Consejo{' '}
        <span className="text-foreground">{importe(m.costo_estimado)}</span>
      </p>
    </div>
  );
}

/** Casillas del consejo agrupadas: la sección arriba y sus casillas debajo, un bloque por sección. */
export function CasillasPorSeccion({
  texto,
  conteo,
}: {
  texto: string | null;
  /** Texto del tooltip: «3 casillas de 5 en la ruta». */
  conteo: string;
}) {
  const grupos = agruparCasillas(texto);
  if (grupos.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <div
      className="flex flex-wrap items-stretch divide-x divide-border"
      title={conteo}
    >
      {grupos.map((g) => (
        <div key={g.seccion} className="px-2 first:pl-0 last:pr-0">
          <p className="text-xs font-semibold text-foreground tabular-nums leading-tight">
            {g.seccion}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {g.tipos.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                appearance="light"
                size="sm"
                className="whitespace-nowrap"
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
