'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { IMecanismo } from '@/types/mecanismos';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ContadorCaracteres } from '@/components/common/contador-caracteres';
import { useGuardarObservacionesMecanismo } from '../_hooks/use-mecanismos';
import { claveMecanismo } from '../_lib/estatus';
import { MECANISMOS_LIMITES } from '../_lib/limites';

interface ObservacionesMecanismoDialogProps {
  mecanismo: IMecanismo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Nota técnica de oficina central sobre el mecanismo; vacía la retira. Cada cambio queda en el historial. */
export function ObservacionesMecanismoDialog({
  mecanismo,
  open,
  onOpenChange,
}: ObservacionesMecanismoDialogProps) {
  const guardar = useGuardarObservacionesMecanismo();
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (open) setTexto(mecanismo?.observaciones_admin ?? '');
  }, [open, mecanismo]);

  if (!mecanismo) return null;

  const limpio = texto.trim();
  const sinCambios = limpio === (mecanismo.observaciones_admin ?? '');

  function handleGuardar() {
    guardar.mutate(
      { id: mecanismo!.id, payload: { observaciones: limpio || null } },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !guardar.isPending && onOpenChange(v)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Observaciones del mecanismo</DialogTitle>
          <DialogDescription>
            {claveMecanismo(mecanismo)}. Nota técnica de oficina central sobre
            el mecanismo. Déjala vacía para retirarla.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="mecanismo-observaciones">Observaciones</Label>
          <Textarea
            id="mecanismo-observaciones"
            rows={5}
            maxLength={MECANISMOS_LIMITES.observaciones.max}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ajustes de ruta, incidencias, acuerdos con el INE..."
            disabled={guardar.isPending}
          />
          <ContadorCaracteres
            valor={texto}
            max={MECANISMOS_LIMITES.observaciones.max}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={guardar.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleGuardar}
            disabled={guardar.isPending || sinCambios}
            aria-busy={guardar.isPending}
          >
            {guardar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
