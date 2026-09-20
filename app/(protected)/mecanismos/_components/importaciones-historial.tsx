'use client';

import { useState } from 'react';
import { Undo2 } from 'lucide-react';
import type { IImportacion, TImportacionTipo } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { getFirstBackendError } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EstadoVacio } from '@/components/common/estado-vacio';
import {
  useImportacionesMecanismos,
  useRevertirImportacionMecanismos,
} from '../_hooks/use-mecanismos-importaciones';
import { MotivoDialog } from './motivo-dialog';

const TIPO_TEXTO: Record<TImportacionTipo, string> = {
  MECANISMOS: 'Archivo del INE',
  CEDULAS: 'Documentos de cédula',
  CAES: 'Listado de CAE',
  CAES_ASIGNACION: 'Asignación de CAE',
};

interface ImportacionesHistorialProps {
  tipo: TImportacionTipo;
  /** Solo se consulta con el apartado a la vista. */
  activo: boolean;
  /** Solo la carga del archivo del INE admite reversión. */
  puedeRevertir?: boolean;
}

/** Cargas hechas en el proceso de un tipo, con sus conteos y quién las hizo. */
export function ImportacionesHistorial({
  tipo,
  activo,
  puedeRevertir = false,
}: ImportacionesHistorialProps) {
  const { data, isLoading, isError, refetch } = useImportacionesMecanismos(
    tipo,
    activo,
  );
  const [aRevertir, setARevertir] = useState<IImportacion | null>(null);

  if (isError) {
    return (
      <ErrorState
        title="No se pudo cargar el historial."
        onRetry={() => refetch()}
      />
    );
  }
  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <EstadoVacio
        titulo="Sin cargas registradas"
        descripcion={`Todavía no se ha cargado ningún ${TIPO_TEXTO[tipo].toLowerCase()} en este proceso.`}
      />
    );
  }

  return (
    <>
      <ul className="space-y-2 max-h-[50vh] overflow-auto pr-1">
        {data.map((imp) => (
          <li
            key={imp.id}
            className={[
              'rounded-md border border-border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
              imp.revertida ? 'opacity-70' : '',
            ].join(' ')}
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  #{imp.id} · {imp.archivo || TIPO_TEXTO[imp.tipo]}
                </span>
                {imp.revertida ? (
                  <Badge variant="destructive" appearance="light" size="sm">
                    Revertida
                  </Badge>
                ) : imp.reversible && puedeRevertir ? (
                  <Badge variant="info" appearance="light" size="sm">
                    Más reciente
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatFechaHora(imp.fecha)} · {imp.usuario || 'Sistema'} ·{' '}
                {imp.total} renglones: {imp.nuevos} nuevos, {imp.actualizados}{' '}
                actualizados, {imp.sin_cambios} sin cambios
                {imp.rechazados > 0 && `, ${imp.rechazados} rechazados`}
              </p>
              {imp.revertida && (
                <p className="text-xs text-destructive">
                  Revertida {formatFechaHora(imp.fecha_reversion)} por{' '}
                  {imp.usuario_reversion || 'Sistema'}: {imp.motivo_reversion}
                </p>
              )}
            </div>
            {puedeRevertir && imp.reversible && !imp.revertida && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setARevertir(imp)}
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Revertir
              </Button>
            )}
          </li>
        ))}
      </ul>

      <RevertirDialog
        importacion={aRevertir}
        onOpenChange={(v) => !v && setARevertir(null)}
      />
    </>
  );
}

function RevertirDialog({
  importacion,
  onOpenChange,
}: {
  importacion: IImportacion | null;
  onOpenChange: (open: boolean) => void;
}) {
  const revertir = useRevertirImportacionMecanismos();
  const [error, setError] = useState<string | null>(null);

  return (
    <MotivoDialog
      open={!!importacion}
      onOpenChange={(v) => {
        setError(null);
        onOpenChange(v);
      }}
      titulo={`Revertir la importación #${importacion?.id ?? ''}`}
      descripcion="Los mecanismos que creó se eliminan y los que actualizó vuelven a su estado anterior. No se puede revertir si alguno ya tiene informe o cédula."
      accion="Revertir"
      icono={<Undo2 className="h-4 w-4" aria-hidden="true" />}
      pendiente={revertir.isPending}
      error={error}
      onConfirmar={(motivo) => {
        if (!importacion) return;
        setError(null);
        revertir.mutate(
          { id: importacion.id, motivo },
          {
            onSuccess: () => onOpenChange(false),
            onError: (err) =>
              setError(
                getFirstBackendError(err) ??
                  'No se pudo revertir la importación.',
              ),
          },
        );
      }}
    />
  );
}
