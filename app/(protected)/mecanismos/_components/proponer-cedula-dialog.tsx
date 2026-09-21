'use client';

import { useEffect, useState } from 'react';
import { CircleAlert, FileText, Loader2, Upload } from 'lucide-react';
import type { ICedulaConsejo } from '@/types/mecanismos';
import { formatMoneda } from '@/lib/helpers';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LeyendaObligatorios } from '@/components/common/leyenda-obligatorios';
import { SelectorArchivo } from '@/components/common/selector-archivo';
import {
  useAprobarCedula,
  useProponerCedula,
  useReemplazarPropuestaCedula,
} from '../_hooks/use-cedulas';
import { claveMecanismo } from '../_lib/estatus';
import { MECANISMOS_LIMITES } from '../_lib/limites';

const PDF = {
  extensiones: ['.pdf'] as const,
  bytes: MECANISMOS_LIMITES.pdf.bytes,
};

interface ProponerCedulaDialogProps {
  cedula: ICedulaConsejo | null;
  /**
   * proponer: PDF y costo INE obligatorios. reemplazar: PDF y/o costo INE (los
   * consejos vuelven a informar). aprobar: PDF aprobado y costo autorizado.
   */
  modo: 'proponer' | 'reemplazar' | 'aprobar';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEXTOS = {
  proponer: {
    titulo: 'Propuesta de cédula',
    descripcion:
      'Sube el PDF de la cédula que entrega el INE y captura su costo. Los consejos vinculados podrán informarla.',
    costo: 'Costo INE (MXN)',
    accion: 'Proponer',
  },
  reemplazar: {
    titulo: 'Reemplazo de la propuesta',
    descripcion:
      'Sustituye el PDF propuesto, el costo INE o ambos. Los consejos que ya informaron deberán informar de nuevo.',
    costo: 'Costo INE (MXN)',
    accion: 'Reemplazar',
  },
  aprobar: {
    titulo: 'Aprobación de cédula',
    descripcion:
      'Sube el PDF aprobado por el INE y el costo máximo autorizado. Los consejos podrán acusar de recibido.',
    costo: 'Costo autorizado (MXN)',
    accion: 'Aprobar',
  },
} as const;

/** Oficina central sube un PDF con su costo: propuesta, reemplazo o aprobación de la cédula. */
export function ProponerCedulaDialog({
  cedula,
  modo,
  open,
  onOpenChange,
}: ProponerCedulaDialogProps) {
  const proponer = useProponerCedula();
  const reemplazar = useReemplazarPropuestaCedula();
  const aprobar = useAprobarCedula();

  const [archivo, setArchivo] = useState<File | null>(null);
  const [costo, setCosto] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setArchivo(null);
    setError(null);
    setCosto(
      modo === 'reemplazar' && cedula?.costo_ine != null
        ? String(cedula.costo_ine)
        : '',
    );
  }, [open, modo, cedula]);

  if (!cedula) return null;

  const pendiente =
    proponer.isPending || reemplazar.isPending || aprobar.isPending;
  const t = TEXTOS[modo];
  const costoNumero = costo.trim() === '' ? null : Number(costo);
  const costoInvalido =
    costoNumero != null &&
    (Number.isNaN(costoNumero) ||
      costoNumero < MECANISMOS_LIMITES.costo.min ||
      costoNumero > MECANISMOS_LIMITES.costo.max);
  const listo =
    !costoInvalido &&
    (modo === 'reemplazar'
      ? !!archivo || (costoNumero != null && costoNumero !== cedula.costo_ine)
      : !!archivo && costoNumero != null);

  function confirmar() {
    if (!listo) return;
    setError(null);
    const opciones = { onSuccess: () => onOpenChange(false) };
    if (modo === 'proponer') {
      proponer.mutate(
        {
          id_mecanismo: cedula!.id,
          costo_ine: costoNumero!,
          archivo: archivo!,
        },
        opciones,
      );
    } else if (modo === 'reemplazar') {
      reemplazar.mutate(
        { id: cedula!.id, payload: { archivo, costo_ine: costoNumero } },
        opciones,
      );
    } else {
      aprobar.mutate(
        {
          id: cedula!.id,
          payload: { costo_autorizado: costoNumero!, archivo: archivo! },
        },
        opciones,
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !pendiente && onOpenChange(v)}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t.titulo}</DialogTitle>
          <DialogDescription>
            {claveMecanismo(cedula)}. {t.descripcion}
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

          {modo === 'aprobar' &&
            cedula.captura_costo &&
            cedula.costo_cotizado != null && (
              <p className="text-sm text-muted-foreground">
                El consejo cotizó {formatMoneda(cedula.costo_cotizado)} contra{' '}
                {formatMoneda(cedula.costo_ine)} del INE.
              </p>
            )}

          <div className="space-y-2">
            <Label htmlFor="cedula-costo">
              {t.costo}{' '}
              {modo !== 'reemplazar' && (
                <span className="text-destructive">*</span>
              )}
            </Label>
            <Input
              id="cedula-costo"
              type="number"
              inputMode="decimal"
              min={MECANISMOS_LIMITES.costo.min}
              max={MECANISMOS_LIMITES.costo.max}
              step="0.01"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              placeholder="0.00"
              aria-invalid={costoInvalido}
              disabled={pendiente}
              className="max-w-56"
            />
            {costoInvalido && (
              <p className="text-sm text-destructive" role="alert">
                El costo debe estar entre 0 y 9,999,999.99.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              PDF {modo === 'aprobar' ? 'aprobado' : 'propuesto'}{' '}
              {modo !== 'reemplazar' && (
                <span className="text-destructive">*</span>
              )}
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
            disabled={!listo || pendiente}
            aria-busy={pendiente}
          >
            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-4 w-4" aria-hidden="true" />
            )}
            {t.accion}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
