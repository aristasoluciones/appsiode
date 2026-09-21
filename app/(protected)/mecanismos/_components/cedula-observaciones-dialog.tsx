'use client';

import { useEffect, useState } from 'react';
import { CheckCheck, Loader2, Lock } from 'lucide-react';
import type { ICedulaConsejo } from '@/types/mecanismos';
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
import { useAcusarCedula, useCerrarCedula } from '../_hooks/use-cedulas';
import { claveMecanismo } from '../_lib/estatus';
import { MECANISMOS_LIMITES } from '../_lib/limites';

interface CedulaObservacionesDialogProps {
  cedula: ICedulaConsejo | null;
  /** Acusar (consejo, no cambia el estatus) o cerrar (oficina central, aprobada → cerrada). */
  modo: 'acusar' | 'cerrar';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEXTOS = {
  acusar: {
    titulo: 'Acuse de la cédula aprobada',
    descripcion:
      'Con el acuse el consejo confirma que recibió la cédula aprobada y su costo autorizado. Las observaciones son opcionales.',
    accion: 'Registrar acuse',
    icono: <CheckCheck className="h-4 w-4" aria-hidden="true" />,
  },
  cerrar: {
    titulo: 'Cierre de la cédula',
    descripcion:
      'La cédula aprobada queda cerrada y ya no admite informes ni acuses; solo podrá anularse con motivo. Las observaciones son opcionales.',
    accion: 'Cerrar cédula',
    icono: <Lock className="h-4 w-4" aria-hidden="true" />,
  },
} as const;

/** Acuse del consejo o cierre de oficina central: ambos llevan observaciones opcionales. */
export function CedulaObservacionesDialog({
  cedula,
  modo,
  open,
  onOpenChange,
}: CedulaObservacionesDialogProps) {
  const acusar = useAcusarCedula();
  const cerrar = useCerrarCedula();
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (open)
      setTexto(modo === 'acusar' ? (cedula?.observaciones_acuse ?? '') : '');
  }, [open, cedula, modo]);

  if (!cedula) return null;

  const pendiente = acusar.isPending || cerrar.isPending;
  const t = TEXTOS[modo];

  function confirmar() {
    const args = {
      id: cedula!.id,
      payload: { observaciones: texto.trim() || null },
    };
    (modo === 'acusar' ? acusar : cerrar).mutate(args, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !pendiente && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.titulo}</DialogTitle>
          <DialogDescription>
            {claveMecanismo(cedula)}. {t.descripcion}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cedula-observaciones">Observaciones</Label>
          <Textarea
            id="cedula-observaciones"
            rows={4}
            maxLength={MECANISMOS_LIMITES.observaciones.max}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={pendiente}
          />
          <ContadorCaracteres
            valor={texto}
            max={MECANISMOS_LIMITES.observaciones.max}
          />
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
            onClick={confirmar}
            disabled={pendiente}
            aria-busy={pendiente}
          >
            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              t.icono
            )}
            {t.accion}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
