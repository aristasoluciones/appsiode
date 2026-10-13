'use client';

import { useEffect, useState } from 'react';
import { Download, LoaderCircleIcon } from 'lucide-react';
import type { IEstudioAvanceDistrito } from '@/types/mecanismos';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useDescargarReporteEstudios } from '../_hooks/use-mecanismos-reportes';

type TAlcance = 'todos' | 'tabla' | 'elegidos';

interface ExportarEstudiosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Los 13 distritos, para elegir. */
  distritos: IEstudioAvanceDistrito[];
  /** Los que se ven en la tabla con los filtros actuales. */
  visibles: IEstudioAvanceDistrito[];
}

/**
 * Exportación del Excel de estudios: todos los distritos, los que se ven en la
 * tabla o una selección; el API acota el archivo a los distritos enviados.
 */
export function ExportarEstudiosDialog({
  open,
  onOpenChange,
  distritos,
  visibles,
}: ExportarEstudiosDialogProps) {
  const exportar = useDescargarReporteEstudios();
  const filtrado = visibles.length !== distritos.length;
  const [alcance, setAlcance] = useState<TAlcance>('todos');
  const [elegidos, setElegidos] = useState<number[]>([]);

  // Al abrir: si hay filtros, se propone exportar lo que se ve.
  useEffect(() => {
    if (!open) return;
    setAlcance(filtrado ? 'tabla' : 'todos');
    setElegidos(visibles.map((d) => d.id_df));
  }, [open, filtrado, visibles]);

  const ids =
    alcance === 'todos'
      ? undefined
      : alcance === 'tabla'
        ? visibles.map((d) => d.id_df)
        : elegidos;
  const sinSeleccion = alcance !== 'todos' && (ids?.length ?? 0) === 0;

  function alternar(id: number, marcado: boolean) {
    setElegidos((prev) =>
      marcado
        ? [...prev, id].sort((a, b) => a - b)
        : prev.filter((x) => x !== id),
    );
  }

  function descargar() {
    exportar.mutate(ids, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !exportar.isPending && onOpenChange(v)}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Exportación de estudios de factibilidad</DialogTitle>
          <DialogDescription>
            Excel con el avance por distrito (revisiones distritales y
            municipales, observaciones por tipo) y la revisión de cada consejo.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 min-h-0 overflow-y-auto -mx-6 px-6">
          <RadioGroup
            value={alcance}
            onValueChange={(v) => setAlcance(v as TAlcance)}
            className="space-y-2"
          >
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="todos" />
              Todos los distritos federales ({distritos.length})
            </Label>
            <Label
              className={`flex items-center gap-2 font-normal ${filtrado ? '' : 'opacity-50'}`}
            >
              <RadioGroupItem value="tabla" disabled={!filtrado} />
              Los que se ven en la tabla ({visibles.length})
            </Label>
            <Label className="flex items-center gap-2 font-normal">
              <RadioGroupItem value="elegidos" />
              Elegir distritos
            </Label>
          </RadioGroup>

          {alcance === 'elegidos' && (
            <div className="rounded-md border border-border">
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted text-xs">
                <span className="text-muted-foreground">
                  {elegidos.length} de {distritos.length} elegidos
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setElegidos(distritos.map((d) => d.id_df))}
                  >
                    Todos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setElegidos([])}
                  >
                    Ninguno
                  </Button>
                </div>
              </div>
              <ul className="max-h-64 overflow-y-auto p-2 space-y-1">
                {distritos.map((d) => (
                  <li key={d.id_df}>
                    <Label className="flex items-center gap-2 font-normal text-sm">
                      <Checkbox
                        checked={elegidos.includes(d.id_df)}
                        onCheckedChange={(v) => alternar(d.id_df, v === true)}
                      />
                      {d.id_df}. {d.df}
                    </Label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sinSeleccion && (
            <p className="text-sm text-destructive" role="alert">
              Elige al menos un distrito federal.
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exportar.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={descargar}
            disabled={exportar.isPending || sinSeleccion}
            aria-busy={exportar.isPending}
          >
            {exportar.isPending ? (
              <LoaderCircleIcon
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
