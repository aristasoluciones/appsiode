'use client';

import { FileText } from 'lucide-react';
import type { IMecanismoLista } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { formatMoneda } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import {
  agruparCasillas,
  ESTATUS_MECANISMO,
  TIPO_MECANISMO_CORTO,
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

/** Folio y nombre del CAE congelado en el mecanismo; avisa si ya no está activo. */
export function CaeTexto({
  m,
}: {
  m: Pick<IMecanismoLista, 'cae_folio' | 'cae_nombre' | 'cae_activo'>;
}) {
  if (!m.cae_folio) {
    return (
      <span className="text-sm text-muted-foreground italic">Sin capturar</span>
    );
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
 * Costo del mecanismo: el del INE como referencia y el que captura el consejo.
 */
export function CostoTexto({
  m,
}: {
  m: Pick<IMecanismoLista, 'costo_ine' | 'costo_estimado'>;
}) {
  return (
    <dl className="text-xs space-y-1">
      <div className="flex items-center justify-between gap-2">
        <dt className="text-muted-foreground">INE</dt>
        <dd>
          <MontoCosto valor={m.costo_ine} origen="ine" />
        </dd>
      </div>
      <div className="flex items-center justify-between gap-2">
        <dt className="text-muted-foreground">Consejo</dt>
        <dd>
          <MontoCosto valor={m.costo_estimado} origen="consejo" />
        </dd>
      </div>
    </dl>
  );
}

/**
 * Monto resaltado con los colores institucionales: gris el del INE, magenta el
 * del consejo. Sin valor, «Sin capturar». Lo comparten la lista y el seguimiento.
 */
export function MontoCosto({
  valor,
  origen,
}: {
  valor: number | null;
  origen: 'ine' | 'consejo';
}) {
  if (valor == null) return importe(null);
  return (
    <span
      className={[
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
        origen === 'ine'
          ? 'bg-secondary text-secondary-foreground'
          : 'bg-primary/10 text-primary',
      ].join(' ')}
    >
      {formatMoneda(valor)}
    </span>
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

/** Identidad del mecanismo en la lista: el número arriba («No. 3») y el tipo debajo. */
export function MecanismoCelda({
  m,
}: {
  m: Pick<IMecanismoLista, 'tipo' | 'numero' | 'activo'>;
}) {
  return (
    <div className={`leading-tight ${m.activo ? '' : 'opacity-60'}`}>
      <p className="text-sm text-foreground whitespace-nowrap">
        <span className="text-xs text-muted-foreground">No.</span>{' '}
        <span className="font-semibold tabular-nums">{m.numero}</span>
      </p>
      <p className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
        {TIPO_MECANISMO_CORTO[m.tipo]}
      </p>
    </div>
  );
}
