'use client';

import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ETAPA_ESTUDIO,
  ETAPAS_FLUJO,
  type TEtapaEstudio,
} from '../_lib/etapas-estudio';

interface EstudiosEtapasProps {
  conteos: Record<TEtapaEstudio, number>;
  activas: TEtapaEstudio[];
  onAlternar: (etapa: TEtapaEstudio) => void;
  isLoading: boolean;
}

/** Una etapa del flujo: el conteo grande, su nombre y, al hacer clic, filtra la tabla. */
function TarjetaEtapa({
  etapa,
  total,
  activa,
  onClick,
  atencion = false,
}: {
  etapa: TEtapaEstudio;
  total: number;
  activa: boolean;
  onClick: () => void;
  /** Espera a oficina central: lleva punto de atención cuando hay alguno. */
  atencion?: boolean;
}) {
  const e = ETAPA_ESTUDIO[etapa];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      title={e.descripcion}
      className={[
        'relative flex-1 min-w-[8.5rem] rounded-lg border px-3 py-2.5 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30',
        activa
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:bg-accent/40',
      ].join(' ')}
    >
      {atencion && total > 0 && (
        <span
          className="absolute top-2 right-2 h-2 w-2 rounded-full bg-warning"
          aria-label="Requiere acción de oficina central"
        />
      )}
      <span className="block text-2xl font-semibold tabular-nums text-foreground leading-none">
        {total}
      </span>
      <span
        className={`block mt-1 text-xs ${activa ? 'text-primary font-medium' : 'text-muted-foreground'}`}
      >
        {e.label}
      </span>
    </button>
  );
}

/**
 * Etapas del estudio como flujo (sin estudio → en revisión → listo para aprobar
 * → aprobado), con «Anulado» aparte. Cada tarjeta es conteo y filtro a la vez:
 * sustituye a los indicadores y a los chips de estatus, que repetían datos.
 */
export function EstudiosEtapas({
  conteos,
  activas,
  onAlternar,
  isLoading,
}: EstudiosEtapasProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2" aria-busy="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 flex-1 min-w-[8.5rem] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-stretch gap-2"
      role="group"
      aria-label="Etapas de los estudios; clic para filtrar"
    >
      {ETAPAS_FLUJO.map((etapa, i) => (
        <div key={etapa} className="contents">
          {i > 0 && (
            <ChevronRight
              className="hidden lg:block self-center h-4 w-4 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
          )}
          <TarjetaEtapa
            etapa={etapa}
            total={conteos[etapa]}
            activa={activas.includes(etapa)}
            onClick={() => onAlternar(etapa)}
            atencion={etapa === 'LISTO'}
          />
        </div>
      ))}
      <span
        className="hidden lg:block w-px self-stretch bg-border mx-1"
        aria-hidden="true"
      />
      <TarjetaEtapa
        etapa="ANULADO"
        total={conteos.ANULADO}
        activa={activas.includes('ANULADO')}
        onClick={() => onAlternar('ANULADO')}
      />
    </div>
  );
}
