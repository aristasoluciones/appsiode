'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { useEstudio } from '../_hooks/use-estudios';
import { HistorialMecanismo } from './historial-mecanismo';

interface EstudioHistorialDialogProps {
  idEstudio: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Historial del estudio en su propia ventana, aparte del detalle de los consejos. */
export function EstudioHistorialDialog({
  idEstudio,
  open,
  onOpenChange,
}: EstudioHistorialDialogProps) {
  const {
    data: e,
    isLoading,
    isError,
    refetch,
  } = useEstudio(open ? idEstudio : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Historial del estudio</DialogTitle>
          <DialogDescription>
            {e
              ? `${e.df}: propuestas, revisiones, revocaciones, aprobación y anulación, del más reciente al más antiguo.`
              : 'Cambios del estudio de factibilidad.'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="min-h-0 overflow-y-auto -mx-6 px-6">
          {isError ? (
            <ErrorState
              title="No se pudo cargar el historial."
              onRetry={() => refetch()}
            />
          ) : isLoading || !e ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <HistorialMecanismo
              historial={e.historial}
              titulo="Movimientos"
              abiertoInicial
            />
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
