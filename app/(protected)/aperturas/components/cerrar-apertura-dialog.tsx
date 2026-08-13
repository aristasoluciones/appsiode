'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCerrarApertura } from '../_hooks/use-aperturas';
import type { IAperturaBodega } from '@/types/aperturas-bodegas';

interface CerrarAperturaDialogProps {
  /** Apertura a cerrar; null cuando el diálogo está inactivo. */
  apertura: IAperturaBodega | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ahora(): { fecha: string; hora: string } {
  const hoy = new Date();
  return {
    fecha: `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`,
    hora: `${String(hoy.getHours()).padStart(2, '0')}:${String(hoy.getMinutes()).padStart(2, '0')}`,
  };
}

/**
 * Registro de cierre de bodega (equivalente al modal del legacy odes):
 * fecha y hora del cierre, sellos en la puerta y observaciones.
 */
export function CerrarAperturaDialog({
  apertura,
  open,
  onOpenChange,
}: CerrarAperturaDialogProps) {
  const cerrar = useCerrarApertura();

  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [sellos, setSellos] = useState(true);
  const [observaciones, setObservaciones] = useState('');

  // Precarga fecha/hora actuales cada vez que se abre para una apertura.
  useEffect(() => {
    if (open) {
      const t = ahora();
      setFecha(t.fecha);
      setHora(t.hora);
      setSellos(true);
      setObservaciones('');
    }
  }, [open, apertura?.id]);

  // La fecha y hora de cierre deben ser posteriores a las de apertura
  // (la API rechaza el caso; se valida aquí para avisar antes de enviar).
  const errorCierre = useMemo(() => {
    if (!fecha || !hora) return 'Captura la fecha y hora del cierre.';
    if (apertura?.fecha_apertura && apertura?.hora_apertura) {
      const dtApertura = new Date(
        `${apertura.fecha_apertura}T${apertura.hora_apertura}`,
      );
      const dtCierre = new Date(`${fecha}T${hora}`);
      if (!Number.isNaN(dtApertura.getTime()) && dtCierre <= dtApertura) {
        return 'La fecha y hora de cierre deben ser posteriores a las de apertura.';
      }
    }
    return null;
  }, [fecha, hora, apertura?.fecha_apertura, apertura?.hora_apertura]);

  async function handleGuardar() {
    if (!apertura || errorCierre) return;
    await cerrar.mutateAsync({
      id: apertura.id,
      payload: {
        fecha_cierre: fecha,
        hora_cierre: hora,
        sellos_cierre: (sellos ? 'true' : 'false') as 'true' | 'false',
        observaciones: observaciones.trim() || undefined,
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!cerrar.isPending) onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registro de cierre de bodega</DialogTitle>
          <DialogDescription>
            Una vez cerrada, la apertura ya no se podrá modificar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>
              Fecha y hora del cierre <span className="text-destructive">*</span>
            </Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                aria-label="Fecha de cierre"
                className="text-center"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                a las
              </span>
              <Input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                aria-label="Hora de cierre"
                className="text-center"
              />
            </div>
            {errorCierre && (
              <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">
                {errorCierre}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <Label htmlFor="sellos-cierre" className="cursor-pointer pr-3">
              Sellos en la puerta de la bodega al momento del cierre
            </Label>
            <Switch
              id="sellos-cierre"
              checked={sellos}
              onCheckedChange={setSellos}
            />
          </div>

          <div>
            <Label htmlFor="observaciones-cierre">Observaciones</Label>
            <Textarea
              id="observaciones-cierre"
              className="mt-1.5"
              rows={4}
              maxLength={2000}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones del cierre (opcional)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cerrar.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleGuardar}
            disabled={cerrar.isPending || !!errorCierre}
          >
            {cerrar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Registrar cierre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
