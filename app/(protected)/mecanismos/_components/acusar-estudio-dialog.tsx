'use client';

import { useEffect, useState } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
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
import { useAcusarEstudio } from '../_hooks/use-estudios';
import { MECANISMOS_LIMITES } from '../_lib/limites';

interface AcusarEstudioDialogProps {
  /** Estudio y etapa a acusar: 1 propuesta, 2 aprobación. */
  objetivo: { id: number; df: string; etapa: 1 | 2 } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Acuse del consejo a la etapa vigente del estudio, con observaciones obligatorias. */
export function AcusarEstudioDialog({
  objetivo,
  open,
  onOpenChange,
}: AcusarEstudioDialogProps) {
  const acusar = useAcusarEstudio();
  const [texto, setTexto] = useState('');
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    if (open) {
      setTexto('');
      setTocado(false);
    }
  }, [open]);

  if (!objetivo) return null;

  const limpio = texto.trim();
  const invalido =
    limpio.length === 0 || limpio.length > MECANISMOS_LIMITES.observaciones.max;
  const etapaTexto = objetivo.etapa === 1 ? 'la propuesta' : 'la aprobación';

  function confirmar() {
    setTocado(true);
    if (invalido || !objetivo) return;
    acusar.mutate(
      {
        id: objetivo.id,
        payload: { etapa: objetivo.etapa, observaciones: limpio },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !acusar.isPending && onOpenChange(v)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Acusar {etapaTexto} · {objetivo.df}
          </DialogTitle>
          <DialogDescription>
            {objetivo.etapa === 1
              ? 'Con el acuse el consejo confirma que revisó el estudio propuesto. Cuando todos los consejos del distrito acusen, oficina central podrá aprobarlo.'
              : 'Con el acuse el consejo confirma que recibió el estudio aprobado. El último acuse cierra el estudio.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="acuse-estudio-observaciones">
            Observaciones <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="acuse-estudio-observaciones"
            rows={4}
            maxLength={MECANISMOS_LIMITES.observaciones.max}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => setTocado(true)}
            aria-invalid={tocado && invalido}
            disabled={acusar.isPending}
          />
          {tocado && invalido && (
            <p className="text-sm text-destructive" role="alert">
              Las observaciones del acuse son obligatorias.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={acusar.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmar}
            disabled={acusar.isPending}
            aria-busy={acusar.isPending}
          >
            {acusar.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
            )}
            Registrar acuse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
