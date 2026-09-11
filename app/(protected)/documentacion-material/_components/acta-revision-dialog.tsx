'use client';

import { useEffect, useState } from 'react';
import { Ban, CheckCircle2, Loader2, MessageSquareWarning } from 'lucide-react';
import { ACTA_LIMITES } from '@/types/material-electoral';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useAceptarActa,
  useAnularActa,
  useObservarActa,
} from '../_hooks/use-actas';
import type { TActaAccion } from './acta-detalle-dialog';

/** Acción de revisión de oficina central sobre un acta. */
export type TRevisionActa = 'observar' | 'aceptar' | 'anular';

interface ActaRevisionDialogProps {
  acta: TActaAccion | null;
  accion: TRevisionActa | null;
  onOpenChange: (open: boolean) => void;
  /** Se avisa al terminar para que el detalle se refresque o se cierre. */
  onTerminada?: (accion: TRevisionActa) => void;
}

/** Texto de cada acción: título, efecto que produce y cómo se pide el motivo. */
const ACCIONES: Record<
  TRevisionActa,
  {
    titulo: (id: number) => string;
    efecto: string;
    etiquetaTexto: string;
    placeholder: string;
    /** Aviso cuando el texto obligatorio va vacío. */
    vacio: string;
    obligatorio: boolean;
    maximo: number;
    boton: string;
    variante: 'primary' | 'destructive';
    icono: typeof Ban;
  }
> = {
  observar: {
    titulo: (id) => `Enviar observaciones del acta #${id}`,
    efecto:
      'El acta pasa a Requerido: el consejo verá tus observaciones, corregirá lo que haga falta, regenerará el documento si es necesario y volverá a subir el PDF firmado para una nueva revisión.',
    etiquetaTexto: 'Observaciones',
    placeholder: 'Indica con claridad qué debe corregir el consejo.',
    vacio: 'Las observaciones son obligatorias.',
    obligatorio: true,
    maximo: ACTA_LIMITES.observaciones.max,
    boton: 'Enviar observaciones',
    variante: 'primary',
    icono: MessageSquareWarning,
  },
  aceptar: {
    titulo: (id) => `Aceptar el acta #${id}`,
    efecto:
      'El acta queda Aceptada y ya no admite cambios. Fija el corte del consejo: los renglones que ampara quedan cerrados y la siguiente acta tomará solo lo comprobado después. Si más adelante se detecta un error, solo se podrá anular con motivo.',
    etiquetaTexto: 'Comentario (opcional)',
    placeholder:
      'Puedes dejar un comentario que quedará en el historial del acta.',
    vacio: '',
    obligatorio: false,
    maximo: ACTA_LIMITES.observaciones.max,
    boton: 'Aceptar acta',
    variante: 'primary',
    icono: CheckCircle2,
  },
  anular: {
    titulo: (id) => `Anular el acta #${id}`,
    efecto:
      'El acta aceptada pasa a Anulada: se conserva con su documento e historial, deja de contar y sus renglones quedan libres para que el consejo genere una nueva acta que la sustituya. Esta acción no se puede deshacer.',
    etiquetaTexto: 'Motivo',
    placeholder: 'Explica por qué se anula esta acta aceptada.',
    vacio: 'El motivo es obligatorio.',
    obligatorio: true,
    maximo: ACTA_LIMITES.motivo.max,
    boton: 'Anular acta',
    variante: 'destructive',
    icono: Ban,
  },
};

/**
 * Revisión de oficina central: observaciones obligatorias (el acta pasa a
 * Requerido), aceptación (queda inmutable) o anulación de un acta aceptada con
 * motivo. Cada acción se confirma explicando su efecto.
 */
export function ActaRevisionDialog({
  acta,
  accion,
  onOpenChange,
  onTerminada,
}: ActaRevisionDialogProps) {
  const observar = useObservarActa();
  const aceptar = useAceptarActa();
  const anular = useAnularActa();

  const [texto, setTexto] = useState('');
  const [tocado, setTocado] = useState(false);

  const open = !!acta && !!accion;

  useEffect(() => {
    if (!open) return;
    setTexto('');
    setTocado(false);
  }, [open]);

  if (!acta || !accion) return null;

  const cfg = ACCIONES[accion];
  const Icono = cfg.icono;
  const pendiente = observar.isPending || aceptar.isPending || anular.isPending;

  const limpio = texto.trim();
  const invalido =
    (cfg.obligatorio && limpio.length === 0) || limpio.length > cfg.maximo;

  function handleConfirmar() {
    setTocado(true);
    if (invalido || !acta || !accion) return;

    const opciones = {
      onSuccess: () => {
        onOpenChange(false);
        onTerminada?.(accion);
      },
    };

    if (accion === 'observar') {
      observar.mutate({ id: acta.id, observaciones: limpio }, opciones);
    } else if (accion === 'aceptar') {
      aceptar.mutate(
        { id: acta.id, observaciones: limpio || undefined },
        opciones,
      );
    } else {
      anular.mutate({ id: acta.id, motivo: limpio }, opciones);
    }
  }

  const idCampo = `acta-revision-${accion}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !pendiente && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{cfg.titulo(acta.id)}</DialogTitle>
          <DialogDescription>{cfg.efecto}</DialogDescription>
        </DialogHeader>

        {accion === 'aceptar' && !acta.archivo_firmado && (
          <Alert variant="warning" icon="warning" appearance="light">
            <AlertIcon>
              <MessageSquareWarning />
            </AlertIcon>
            <AlertTitle>
              El acta todavía no tiene el PDF firmado; la API rechazará la
              aceptación hasta que el consejo lo suba.
            </AlertTitle>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor={idCampo}>
            {cfg.etiquetaTexto}
            {cfg.obligatorio && <span className="text-destructive"> *</span>}
          </Label>
          <Textarea
            id={idCampo}
            rows={4}
            maxLength={cfg.maximo}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => setTocado(true)}
            placeholder={cfg.placeholder}
            aria-invalid={tocado && invalido}
            disabled={pendiente}
          />
          {tocado && invalido && (
            <p className="text-sm text-destructive" role="alert">
              {cfg.obligatorio && limpio.length === 0
                ? cfg.vacio
                : `El texto no debe superar ${cfg.maximo} caracteres.`}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pendiente}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={cfg.variante}
            onClick={handleConfirmar}
            disabled={pendiente}
            aria-busy={pendiente}
          >
            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Icono className="h-4 w-4" aria-hidden="true" />
            )}
            {cfg.boton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
