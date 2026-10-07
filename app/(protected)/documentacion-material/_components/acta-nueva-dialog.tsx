'use client';

import { useEffect, useState } from 'react';
import { FilePlus2, Info, Loader2 } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LeyendaObligatorios } from '@/components/common/leyenda-obligatorios';
import { useAbrirBorrador } from '../_hooks/use-actas';
import { useTiposActa } from '../_hooks/use-tipos-acta';
import { ActaTiposArticuloSelector } from './acta-tipos-articulo-campo';

interface ActaNuevaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Borrador recién creado: se abre en el generador. */
  onCreada: (idActa: number) => void;
}

/**
 * Primer paso de un acta nueva: elegir los tipos de artículo que entrarán. El
 * borrador reserva esos tipos desde que se crea, así que los que ya están en
 * otra acta en curso aparecen deshabilitados con el número de esa acta.
 */
export function ActaNuevaDialog({
  open,
  onOpenChange,
  onCreada,
}: ActaNuevaDialogProps) {
  const abrir = useAbrirBorrador();
  const { opciones, ocupados, cargando } = useTiposActa({ habilitado: open });
  const [tipos, setTipos] = useState<string[]>([]);

  useEffect(() => {
    if (open) setTipos([]);
  }, [open]);

  const libres = opciones.filter((o) => ocupados[o.clave] == null);
  const sinLibres = !cargando && opciones.length > 0 && libres.length === 0;

  function cerrar(valor: boolean) {
    if (abrir.isPending) return;
    onOpenChange(valor);
  }

  function handleAbrir() {
    abrir.mutate(tipos, {
      onSuccess: (acta) => {
        onOpenChange(false);
        onCreada(acta.id);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva acta circunstanciada</DialogTitle>
          <DialogDescription>
            Elige qué tipos de artículo entrarán en esta acta. Se reservan desde
            que abres el borrador y puedes cambiarlos mientras sea borrador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {sinLibres && (
            <Alert variant="info" icon="info" appearance="light">
              <AlertIcon>
                <Info />
              </AlertIcon>
              <AlertTitle>
                Todos los tipos ya están en actas en curso. Cuando una se
                acepte, se anule o se descarte, sus tipos quedarán libres.
              </AlertTitle>
            </Alert>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Seleccione los tipos que entrarán en esta acta{' '}
              <span className="text-destructive">*</span>
            </p>
            <ActaTiposArticuloSelector
              opciones={opciones}
              value={tipos}
              onChange={setTipos}
              ocupados={ocupados}
              loading={cargando}
              disabled={abrir.isPending}
            />
            <p className="text-xs text-muted-foreground text-justify hyphens-auto">
              Un tipo solo puede estar en un acta en curso a la vez: borrador,
              generada, en revisión o requerida.
            </p>
          </div>

          <LeyendaObligatorios />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={abrir.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAbrir}
            disabled={tipos.length === 0 || abrir.isPending}
            aria-busy={abrir.isPending}
          >
            {abrir.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            )}
            Abrir borrador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
