'use client';

import { useEffect, useRef, useState } from 'react';
import { FileUp, Info, Loader2, X } from 'lucide-react';
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
import { useSubirFirmadaActa } from '../_hooks/use-actas';
import type { TActaAccion } from './acta-detalle-dialog';

interface ActaFirmadaDialogProps {
  acta: TActaAccion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function tamano(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
}

/**
 * Subida del PDF firmado: se revisa en pantalla que sea PDF y que no pase de
 * 20 MB, se avisa que el acta pasa a En revisión y, si ya había uno, que se
 * reemplaza. La validación autoritativa (PDF real) es de la API.
 */
export function ActaFirmadaDialog({
  acta,
  open,
  onOpenChange,
}: ActaFirmadaDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const subir = useSubirFirmadaActa();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setArchivo(null);
    setError(null);
  }, [open]);

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!f) return;
    const esPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    if (!esPdf) {
      setArchivo(null);
      setError('El archivo debe ser un PDF.');
      return;
    }
    if (f.size > ACTA_LIMITES.firmada.bytes) {
      setArchivo(null);
      setError(`El PDF pesa ${tamano(f.size)}; el máximo es 20 MB.`);
      return;
    }
    setError(null);
    setArchivo(f);
  }

  function handleSubir() {
    if (!acta || !archivo) return;
    subir.mutate(
      { id: acta.id, archivo },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  if (!acta) return null;

  const reemplaza = !!acta.archivo_firmado;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !subir.isPending && onOpenChange(v)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {reemplaza
              ? 'Volver a subir el PDF firmado'
              : 'Subir el PDF firmado'}
          </DialogTitle>
          <DialogDescription>
            Acta #{acta.id}. Imprime el Word generado, recaba las firmas y sube
            aquí el documento escaneado en PDF (hasta 20 MB).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="info" icon="info" appearance="light">
            <AlertIcon>
              <Info />
            </AlertIcon>
            <AlertTitle>
              Al subirlo, el acta pasa a <strong>En revisión</strong> de oficina
              central{reemplaza ? ' y el PDF anterior se reemplaza' : ''}.
            </AlertTitle>
          </Alert>

          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            aria-label="Seleccionar el PDF firmado"
            onChange={handleArchivo}
            disabled={subir.isPending}
          />

          {archivo ? (
            <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
              <FileUp
                className="h-5 w-5 text-primary shrink-0"
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {archivo.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tamano(archivo.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar archivo"
                onClick={() => setArchivo(null)}
                disabled={subir.isPending}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={subir.isPending}
              className="w-full flex flex-col items-center justify-center py-8 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-center hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
            >
              <FileUp
                className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground font-medium">
                Elegir el PDF firmado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Solo PDF · máximo 20 MB
              </p>
            </button>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={subir.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubir}
            disabled={!archivo || subir.isPending}
            aria-busy={subir.isPending}
          >
            {subir.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <FileUp className="h-4 w-4" aria-hidden="true" />
            )}
            {reemplaza
              ? 'Reemplazar y enviar a revisión'
              : 'Subir y enviar a revisión'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
