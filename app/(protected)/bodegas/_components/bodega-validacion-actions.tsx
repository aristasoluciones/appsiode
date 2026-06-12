'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
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
import { useValidarBodega, useEnviarObservacionesBodega } from '../_hooks/use-bodegas';
import type { IObservacionBodega, IFotografiaConfig } from '@/types/bodegas';

interface BodegaValidacionActionsProps {
  idBodega: number;
  /** true cuando todas las fotografías están en status 'Validada' */
  allPhotosValidada: boolean;
  /** Todas las observaciones de la bodega (pendientes y solventadas) */
  observaciones: IObservacionBodega[];
  /** Indica si hay un acuerdo cargado */
  hasAcuerdo: boolean;
  /** Configs de fotografías para resolver títulos de categorías */
  fotografiaConfigs?: IFotografiaConfig[];
}

export function BodegaValidacionActions({
  idBodega,
  allPhotosValidada,
  observaciones,
  hasAcuerdo,
  fotografiaConfigs = [],
}: BodegaValidacionActionsProps) {
  const [confirmValidarOpen, setConfirmValidarOpen] = useState(false);
  const [confirmEnviarOpen, setConfirmEnviarOpen] = useState(false);
  const [resumenOpen, setResumenOpen] = useState(false);

  const { mutate: validar, isPending: validando } = useValidarBodega();
  const { mutate: enviarObservaciones, isPending: enviando } = useEnviarObservacionesBodega();

  const observacionesPendientes = observaciones.filter((o) => o.status === 'Pendiente');

  const puedeValidar = allPhotosValidada && hasAcuerdo && observacionesPendientes.length === 0;
  const puedeEnviar = observacionesPendientes.length > 0;

  function handleValidar() {
    validar(idBodega, {
      onSuccess: () => setConfirmValidarOpen(false),
    });
  }

  function handleEnviar() {
    enviarObservaciones(idBodega, {
      onSuccess: () => {
        setConfirmEnviarOpen(false);
        setResumenOpen(false);
      },
    });
  }

  function abrirResumen() {
    setResumenOpen(true);
  }

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
      {puedeValidar && (
        <Button
          size="sm"
          className="gap-1.5"
          disabled={validando}
          onClick={() => setConfirmValidarOpen(true)}
        >
          {validando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Validar bodega
        </Button>
      )}

      {puedeEnviar && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950/30"
          disabled={enviando}
          onClick={abrirResumen}
        >
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Requerir
        </Button>
      )}

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

      {/* Confirmación validar bodega */}
      <AlertDialog open={confirmValidarOpen} onOpenChange={setConfirmValidarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ¿Validar bodega?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción validará la bodega y cambiará su estatus a <strong>Validada</strong>. Asegúrate de que todas las fotografías y el acuerdo han sido revisados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={validando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={validando}
              onClick={handleValidar}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {validando && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Sí, validar
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
