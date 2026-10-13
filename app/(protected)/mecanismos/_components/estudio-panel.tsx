'use client';

import { History, PanelRightClose } from 'lucide-react';
import type { IEstudio, IEstudioRevisionConsejo } from '@/types/mecanismos';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { useEstudio } from '../_hooks/use-estudios';
import { EstudioBadge } from './estudio-badges';
import { EstudioDetalleCuerpo } from './estudio-detalle-cuerpo';

interface EstudioPanelProps {
  idEstudio: number;
  onCerrar: () => void;
  onHistorial: (idEstudio: number) => void;
  onRevocar?: (estudio: IEstudio, consejo: IEstudioRevisionConsejo) => void;
}

/**
 * Detalle del estudio a la derecha de la lista de distritos (no es ventana
 * modal), como la cédula en mecanismos: al elegir otro distrito el panel
 * cambia. El historial se abre aparte con su botón.
 */
export function EstudioPanel({
  idEstudio,
  onCerrar,
  onHistorial,
  onRevocar,
}: EstudioPanelProps) {
  const { data: e, isLoading, isError, refetch } = useEstudio(idEstudio);

  return (
    <aside
      className="flex flex-col rounded-lg border border-border bg-card overflow-hidden h-[70vh] xl:h-[calc(100vh-var(--header-height,70px)-2rem)]"
      aria-label="Detalle del estudio de factibilidad"
    >
      <header className="flex items-start justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {e ? `Distrito federal ${e.id_df}` : 'Estudio de factibilidad'}
          </p>
          <p className="text-sm font-semibold text-foreground truncate">
            {e?.df ?? '…'}
          </p>
          {e && <EstudioBadge estatus={e.estatus} />}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onHistorial(idEstudio)}
            disabled={!e}
          >
            <History className="h-4 w-4" aria-hidden="true" />
            Historial
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCerrar}
            aria-label="Cerrar el detalle"
          >
            <PanelRightClose className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6">
        {isError ? (
          <ErrorState
            title="No se pudo cargar el estudio."
            onRetry={() => refetch()}
          />
        ) : isLoading || !e ? (
          <div className="space-y-3" aria-busy="true">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <EstudioDetalleCuerpo key={e.id} e={e} onRevocar={onRevocar} />
        )}
      </div>
    </aside>
  );
}
