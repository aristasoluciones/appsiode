'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { MECANISMOS_LIMITES } from '../_lib/limites';

interface MotivoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descripcion: string;
  /** Texto del botón que confirma: «Anular cédula», «Revertir». */
  accion: string;
  icono?: React.ReactNode;
  onConfirmar: (motivo: string) => void;
  pendiente: boolean;
  /** Mensaje del API cuando rechaza; la ventana lo muestra bajo el motivo. */
  error?: string | null;
}

/** Confirmación destructiva con motivo obligatorio (anular, revertir), con los límites del API. */
export function MotivoDialog({
  open,
  onOpenChange,
  titulo,
  descripcion,
  accion,
  icono,
  onConfirmar,
  pendiente,
  error,
}: MotivoDialogProps) {
  const [motivo, setMotivo] = useState('');
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    if (open) {
      setMotivo('');
      setTocado(false);
    }
  }, [open]);

  const limpio = motivo.trim();
  const invalido =
    limpio.length < MECANISMOS_LIMITES.motivo.min ||
    limpio.length > MECANISMOS_LIMITES.motivo.max;

  return (
    <Dialog open={open} onOpenChange={(v) => !pendiente && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="motivo-dialog-texto">
            Motivo <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="motivo-dialog-texto"
            rows={3}
            value={motivo}
            maxLength={MECANISMOS_LIMITES.motivo.max}
            onChange={(e) => setMotivo(e.target.value)}
            onBlur={() => setTocado(true)}
            placeholder={`Al menos ${MECANISMOS_LIMITES.motivo.min} caracteres.`}
            aria-invalid={tocado && invalido}
            disabled={pendiente}
          />
          {tocado && invalido && (
            <p className="text-sm text-destructive" role="alert">
              El motivo debe tener entre {MECANISMOS_LIMITES.motivo.min} y{' '}
              {MECANISMOS_LIMITES.motivo.max} caracteres.
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pendiente}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setTocado(true);
              if (!invalido) onConfirmar(limpio);
            }}
            disabled={pendiente}
            aria-busy={pendiente}
          >
            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              icono
            )}
            {accion}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
