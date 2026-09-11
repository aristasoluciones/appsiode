'use client';

import { useEffect, useState } from 'react';
import { Loader2, Undo2 } from 'lucide-react';
import { ACTA_LIMITES } from '@/types/material-electoral';
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
import { useDescartarActa } from '../_hooks/use-actas';
import type { TActaAccion } from './acta-detalle-dialog';
import { ESTATUS_ACTA } from './acta-estatus';

interface ActaDescartarDialogProps {
  acta: TActaAccion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDescartada?: () => void;
}

/**
 * Descarte del acta por el consejo, con motivo obligatorio, mientras no esté
 * aceptada. El acta se conserva como registro y el consejo puede generar otra.
 */
export function ActaDescartarDialog({
  acta,
  open,
  onOpenChange,
  onDescartada,
}: ActaDescartarDialogProps) {
  const descartar = useDescartarActa();
  const [motivo, setMotivo] = useState('');
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMotivo('');
    setTocado(false);
  }, [open]);

  if (!acta) return null;

  const limpio = motivo.trim();
  const invalido =
    limpio.length === 0 || limpio.length > ACTA_LIMITES.motivo.max;

  function handleDescartar() {
    setTocado(true);
    if (invalido || !acta) return;
    descartar.mutate(
      { id: acta.id, motivo: limpio },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDescartada?.();
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !descartar.isPending && onOpenChange(v)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Descartar el acta #{acta.id}</DialogTitle>
          <DialogDescription>
            El acta está {ESTATUS_ACTA[acta.estatus]?.label.toLowerCase()}. Al
            descartarla se conserva solo como registro, sus renglones quedan
            libres y el consejo puede generar una nueva. Esta acción no se puede
            deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="acta-descartar-motivo">
            Motivo <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="acta-descartar-motivo"
            rows={4}
            maxLength={ACTA_LIMITES.motivo.max}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            onBlur={() => setTocado(true)}
            placeholder="Explica por qué se descarta esta acta."
            aria-invalid={tocado && invalido}
            disabled={descartar.isPending}
          />
          {tocado && invalido && (
            <p className="text-sm text-destructive" role="alert">
              El motivo es obligatorio.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={descartar.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDescartar}
            disabled={descartar.isPending}
            aria-busy={descartar.isPending}
          >
            {descartar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Undo2 className="h-4 w-4" aria-hidden="true" />
            )}
            Descartar acta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
