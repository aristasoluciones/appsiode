'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useDeterminarBodega, useEnviarObservacionesBodega } from '../_hooks/use-bodegas';
import type { IObservacionBodega, IFotografiaConfig } from '@/types/bodegas';

interface BodegaValidacionActionsProps {
  idBodega: number;
  /** Todas las observaciones de la bodega */
  observaciones: IObservacionBodega[];
  /** Configs de fotografías para resolver títulos de categorías */
  fotografiaConfigs?: IFotografiaConfig[];
  /** Control externo del diálogo de confirmación de determinar */
  determinarOpen?: boolean;
  onDeterminarOpenChange?: (open: boolean) => void;
  /** Control externo del diálogo de resumen de observaciones */
  requerirOpen?: boolean;
  onRequerirOpenChange?: (open: boolean) => void;
}

export function BodegaValidacionActions({
  idBodega,
  observaciones,
  fotografiaConfigs = [],
  determinarOpen,
  onDeterminarOpenChange,
  requerirOpen,
  onRequerirOpenChange,
}: BodegaValidacionActionsProps) {
  const [confirmEnviarOpen, setConfirmEnviarOpen] = useState(false);

  const { mutate: determinar, isPending: determinando } = useDeterminarBodega();
  const { mutate: enviarObservaciones, isPending: enviando } = useEnviarObservacionesBodega();

  const observacionesPendientes = observaciones.filter((o) => o.status === 'Pendiente');

  function handleDeterminar() {
    determinar(idBodega, {
      onSuccess: () => onDeterminarOpenChange?.(false),
    });
  }

  function handleEnviar() {
    enviarObservaciones(idBodega, {
      onSuccess: () => {
        setConfirmEnviarOpen(false);
        onRequerirOpenChange?.(false);
      },
    });
  }

  const resumenOpen = requerirOpen ?? false;
  const setResumenOpen = onRequerirOpenChange ?? (() => {});

  const seccionLabel: Record<string, string> = {
    Fotografias: 'Fotografía',
    Acuerdos: 'Acuerdo',
    General: 'General',
  };

  const configMap = new Map(fotografiaConfigs.map((c) => [c.id, c]));

  function referenciaLabel(obs: IObservacionBodega) {
    if (obs.seccion === 'Fotografias') {
      const cfg = configMap.get(obs.id_referencia);
      return cfg?.descripcion ?? `Ref. #${obs.id_referencia}`;
    }
    if (obs.seccion === 'Acuerdos') {
      return 'Acuerdo de bodega';
    }
    return '';
  }

  return (
    <>
      {/* Dialog de resumen de observaciones */}
      <Dialog open={resumenOpen} onOpenChange={setResumenOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-rose-500" />
              Resumen de observaciones
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {observacionesPendientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay observaciones pendientes.</p>
            ) : (
              observacionesPendientes.map((obs) => (
                <div
                  key={obs.id}
                  className="rounded-lg border border-border bg-muted/20 p-3 space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {seccionLabel[obs.seccion] ?? obs.seccion}
                    </span>
                    {referenciaLabel(obs) && (
                      <span className="text-[10px] text-muted-foreground">
                        {referenciaLabel(obs)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{obs.observacion}</p>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={() => setResumenOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={observacionesPendientes.length === 0 || enviando}
              onClick={() => setConfirmEnviarOpen(true)}
            >
              {enviando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Requerir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación determinar bodega */}
      <AlertDialog open={determinarOpen ?? false} onOpenChange={onDeterminarOpenChange ?? (() => {})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ¿Determinar bodega?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción determinará la bodega y cambiará su estatus a <strong>Determinada</strong>. Asegúrate de que todas las fotografías y el acuerdo han sido revisados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={determinando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={determinando}
              onClick={handleDeterminar}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {determinando && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Sí, determinar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación enviar observaciones */}
      <AlertDialog open={confirmEnviarOpen} onOpenChange={setConfirmEnviarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              ¿Requerir observaciones?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se requerirán <strong>{observacionesPendientes.length}</strong> observación{observacionesPendientes.length !== 1 ? 'es' : ''} y el estatus de la bodega cambiará a <strong>Observada</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={enviando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={enviando}
              onClick={handleEnviar}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {enviando && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Sí, requerir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
