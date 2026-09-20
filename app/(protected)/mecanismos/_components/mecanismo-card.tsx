'use client';

import { Eye, FilePen, Pencil } from 'lucide-react';
import type { IMecanismoLista } from '@/types/mecanismos';
import { formatMoneda } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  agruparCasillas,
  claveMecanismo,
  ESTATUS_CEDULA,
} from '../_lib/estatus';

export interface MecanismoAcciones {
  onVerDetalle: (m: IMecanismoLista) => void;
  /** Consejo: abre el informe; ausente = sin permiso o solo lectura. */
  onInformar?: (m: IMecanismoLista) => void;
  /** Oficina central: abre la edición; ausente = sin permiso. */
  onEditar?: (m: IMecanismoLista) => void;
}

export function CedulaBadge({
  m,
}: {
  m: Pick<IMecanismoLista, 'cedula_estatus' | 'cedula_estatus_desc'>;
}) {
  const e = ESTATUS_CEDULA[m.cedula_estatus];
  return (
    <Badge variant={e?.variant ?? 'secondary'} appearance="light" size="sm">
      {e?.label ?? m.cedula_estatus_desc}
    </Badge>
  );
}

export function InformeBadge({ m }: { m: Pick<IMecanismoLista, 'informado'> }) {
  return (
    <Badge
      variant={m.informado ? 'success' : 'secondary'}
      appearance="light"
      size="sm"
    >
      {m.informado ? 'Informado' : 'Sin informar'}
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

/**
 * Costo del mecanismo. El consejo ve el que captura; oficina central ve el
 * costo INE, el del consejo y la diferencia (consejo menos INE).
 */
/** Importe en pesos o «Sin capturar»: un cero se leería como un costo real. */
function importe(valor: number | null) {
  return valor == null ? (
    <span className="text-muted-foreground italic">Sin capturar</span>
  ) : (
    formatMoneda(valor)
  );
}

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
  const diferencia =
    m.costo_ine != null && m.costo_estimado != null
      ? m.costo_estimado - m.costo_ine
      : null;
  return (
    <div className="tabular-nums text-xs leading-tight space-y-0.5">
      <p className="text-muted-foreground">
        INE <span className="text-foreground">{importe(m.costo_ine)}</span>
      </p>
      <p className="text-muted-foreground">
        Consejo{' '}
        <span className="text-foreground">{importe(m.costo_estimado)}</span>
      </p>
      {diferencia != null && (
        <p
          className={
            diferencia > 0
              ? 'text-destructive'
              : diferencia < 0
                ? 'text-green-700 dark:text-green-400'
                : 'text-muted-foreground'
          }
        >
          Dif. {diferencia > 0 ? '+' : ''}
          {formatMoneda(diferencia)}
        </p>
      )}
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

/** Tarjeta de un mecanismo en móvil, para el consejo y para oficina central. */
export function MecanismoCard({
  m,
  consejo,
  modo,
  onVerDetalle,
  onInformar,
  onEditar,
}: {
  m: IMecanismoLista;
  consejo: string;
  modo: 'consejo' | 'admin';
} & MecanismoAcciones) {
  return (
    <article
      className={[
        'border border-border rounded-lg p-4 space-y-3 bg-card',
        m.activo ? '' : 'opacity-70',
      ].join(' ')}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {claveMecanismo(m)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {consejo}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onInformar && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px] gap-1.5"
              onClick={() => onInformar(m)}
            >
              <FilePen className="h-4 w-4" aria-hidden="true" />
              Informar
            </Button>
          )}
          {onEditar && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px] gap-1.5"
              onClick={() => onEditar(m)}
              disabled={!m.activo}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Editar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="min-h-[40px] gap-1.5"
            onClick={() => onVerDetalle(m)}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Ver
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground mb-1">
            Secciones y casillas ({m.casillas_propias})
          </p>
          <CasillasPorSeccion
            texto={m.casillas_propias_texto}
            conteo={`${m.casillas_propias} casillas`}
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Costo</p>
          <CostoTexto m={m} modo={modo} />
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">CAE</p>
          <CaeTexto m={m} />
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
        <InformeBadge m={m} />
        <CedulaBadge m={m} />
        {!m.activo && (
          <Badge variant="destructive" appearance="light" size="sm">
            Inactivo
          </Badge>
        )}
      </footer>
    </article>
  );
}
