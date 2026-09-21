'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleAlert, FileText, Loader2, Upload } from 'lucide-react';
import type { IEstudioAvanceDistrito } from '@/types/mecanismos';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeyendaObligatorios } from '@/components/common/leyenda-obligatorios';
import { SelectorArchivo } from '@/components/common/selector-archivo';
import {
  useAprobarEstudio,
  useProponerEstudio,
  useReemplazarPropuestaEstudio,
} from '../_hooks/use-estudios';
import { MECANISMOS_LIMITES } from '../_lib/limites';

const PDF = {
  extensiones: ['.pdf'] as const,
  bytes: MECANISMOS_LIMITES.pdf.bytes,
};

interface ProponerEstudioDialogProps {
  /** Distritos del tablero; en «proponer» se eligen los que admiten estudio. */
  distritos: IEstudioAvanceDistrito[];
  /** Distrito preseleccionado (proponer) o estudio a reemplazar / aprobar. */
  distrito: IEstudioAvanceDistrito | null;
  modo: 'proponer' | 'reemplazar' | 'aprobar';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEXTOS = {
  proponer: {
    titulo: 'Propuesta del estudio',
    descripcion:
      'Sube el PDF del estudio del distrito federal. Se crea un acuse para cada consejo del distrito.',
    accion: 'Proponer',
  },
  reemplazar: {
    titulo: 'Reemplazo del estudio propuesto',
    descripcion:
      'Sustituye el PDF mientras el estudio siga propuesto. Los consejos deberán acusar de nuevo.',
    accion: 'Reemplazar',
  },
  aprobar: {
    titulo: 'Aprobación del estudio',
    descripcion:
      'Sube el PDF aprobado. Solo procede cuando todos los consejos del distrito acusaron la propuesta.',
    accion: 'Aprobar',
  },
} as const;

/** Oficina central sube el PDF del estudio: propuesta (con distrito), reemplazo o aprobación. */
export function ProponerEstudioDialog({
  distritos,
  distrito,
  modo,
  open,
  onOpenChange,
}: ProponerEstudioDialogProps) {
  const proponer = useProponerEstudio();
  const reemplazar = useReemplazarPropuestaEstudio();
  const aprobar = useAprobarEstudio();

  const [idDf, setIdDf] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Admiten estudio los distritos sin uno vigente (sin estudio o anulado).
  const elegibles = useMemo(
    () => distritos.filter((d) => !d.cargado),
    [distritos],
  );

  useEffect(() => {
    if (!open) return;
    setArchivo(null);
    setError(null);
    setIdDf(distrito ? String(distrito.id_df) : '');
  }, [open, distrito]);

  const pendiente =
    proponer.isPending || reemplazar.isPending || aprobar.isPending;
  const t = TEXTOS[modo];
  const listo = !!archivo && (modo !== 'proponer' || idDf !== '');

  function confirmar() {
    if (!listo || !archivo) return;
    const opciones = { onSuccess: () => onOpenChange(false) };
    if (modo === 'proponer')
      proponer.mutate({ id_df: Number(idDf), archivo }, opciones);
    else if (modo === 'reemplazar' && distrito?.id)
      reemplazar.mutate({ id: distrito.id, archivo }, opciones);
    else if (modo === 'aprobar' && distrito?.id)
      aprobar.mutate({ id: distrito.id, archivo }, opciones);
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
            {modo !== 'proponer' && distrito ? `${distrito.df}. ` : ''}
            {t.descripcion}
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

          {modo === 'proponer' && (
            <div className="space-y-2">
              <Label>
                Distrito federal <span className="text-destructive">*</span>
              </Label>
              <Select
                indicatorVisibility={false}
                value={idDf}
                onValueChange={setIdDf}
                disabled={pendiente}
              >
                <SelectTrigger aria-label="Distrito federal">
                  <SelectValue placeholder="Elige el distrito" />
                </SelectTrigger>
                <SelectContent>
                  {elegibles.map((d) => (
                    <SelectItem key={d.id_df} value={String(d.id_df)}>
                      {d.id_df}. {d.df}
                      {d.estatus === 'ANULADO' ? ' (anulado)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {elegibles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Todos los distritos ya tienen un estudio vigente.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>
              PDF del estudio {modo === 'aprobar' ? 'aprobado' : 'propuesto'}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <SelectorArchivo
              archivo={archivo}
              onChange={setArchivo}
              onError={setError}
              limites={PDF}
              etiqueta="Selecciona el PDF del estudio"
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
