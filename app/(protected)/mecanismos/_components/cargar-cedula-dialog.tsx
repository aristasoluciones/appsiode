'use client';

import { useEffect, useState } from 'react';
import { CircleAlert, FileText, Loader2, Upload } from 'lucide-react';
import type { IMecanismoLista } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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
import { Label } from '@/components/ui/label';
import { LeyendaObligatorios } from '@/components/common/leyenda-obligatorios';
import { SelectorArchivo } from '@/components/common/selector-archivo';
import { useCargarCedula } from '../_hooks/use-mecanismo-cedula';
import { claveMecanismo } from '../_lib/estatus';
import { MECANISMOS_LIMITES } from '../_lib/limites';

const PDF = {
  extensiones: ['.pdf'] as const,
  bytes: MECANISMOS_LIMITES.pdf.bytes,
};

interface CargarCedulaDialogProps {
  mecanismo: IMecanismoLista | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Oficina central carga o reemplaza el PDF de la cédula de un mecanismo. */
export function CargarCedulaDialog({
  mecanismo,
  open,
  onOpenChange,
}: CargarCedulaDialogProps) {
  const cargar = useCargarCedula();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setArchivo(null);
    setError(null);
  }, [open]);

  if (!mecanismo) return null;

  const reemplaza = mecanismo.tiene_cedula;
  const pendiente = cargar.isPending;

  function confirmar() {
    if (!archivo || !mecanismo) return;
    cargar.mutate(
      { id: mecanismo.id, archivo },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !pendiente && onOpenChange(v)}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {reemplaza ? 'Reemplazo de la cédula' : 'Carga de la cédula'}
          </DialogTitle>
          <DialogDescription>
            {claveMecanismo(mecanismo)}.{' '}
            {reemplaza
              ? `Sustituye el PDF cargado el ${formatFechaHora(mecanismo.cedula_fecha)}; el anterior deja de estar disponible.`
              : 'Sube el PDF de la cédula; los consejos vinculados podrán consultarlo desde sus mecanismos.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {error && (
            <Alert variant="destructive" appearance="light" close={false}>
              <AlertIcon>
                <CircleAlert />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>
              PDF de la cédula <span className="text-destructive">*</span>
            </Label>
            <SelectorArchivo
              archivo={archivo}
              onChange={setArchivo}
              onError={setError}
              limites={PDF}
              etiqueta="Selecciona el PDF de la cédula"
              descripcion="PDF de hasta 10 MB"
              disabled={pendiente}
              icono={<FileText />}
            />
          </div>
        </DialogBody>

        <LeyendaObligatorios />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pendiente}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmar}
            disabled={!archivo || pendiente}
            aria-busy={pendiente}
          >
            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-4 w-4" aria-hidden="true" />
            )}
            {reemplaza ? 'Reemplazar' : 'Cargar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
