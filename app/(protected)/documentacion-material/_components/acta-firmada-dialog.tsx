'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileSearch, FileUp, Info, Loader2, X } from 'lucide-react';
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
 * Subida del PDF firmado: a la izquierda se elige o se arrastra el archivo y a
 * la derecha se ve de inmediato, para confirmar que es el documento correcto
 * antes de enviarlo. Se revisa en pantalla que sea PDF y que no pase de 20 MB;
 * la validación autoritativa (PDF real) es de la API.
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
  const [arrastrando, setArrastrando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setArchivo(null);
    setError(null);
    setArrastrando(false);
  }, [open]);

  // Vista previa local: el PDF se muestra desde el navegador, sin subirlo.
  const vistaPrevia = useMemo(
    () => (archivo ? URL.createObjectURL(archivo) : null),
    [archivo],
  );
  useEffect(() => {
    if (!vistaPrevia) return;
    return () => URL.revokeObjectURL(vistaPrevia);
  }, [vistaPrevia]);

  function elegir(f: File | null) {
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

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    elegir(f);
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setArrastrando(false);
    if (subir.isPending) return;
    elegir(e.dataTransfer.files?.[0] ?? null);
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
      <DialogContent className="sm:max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle>
            {reemplaza ? 'Reemplazo del PDF firmado' : 'PDF firmado del acta'}
          </DialogTitle>
          <DialogDescription>
            Acta #{acta.id}. Imprime el Word generado, recaba las firmas y sube
            aquí el documento escaneado en PDF (hasta 20 MB).
          </DialogDescription>
        </DialogHeader>

        {/* 30 % para elegir el archivo y 70 % para su vista previa. */}
        <div className="grid gap-4 md:grid-cols-[3fr_7fr]">
          <div className="min-w-0 space-y-4">
            <Alert variant="info" icon="info" appearance="light">
              <AlertIcon>
                <Info />
              </AlertIcon>
              <AlertTitle>
                Al subirlo, el acta pasa a <strong>En revisión</strong> de
                oficina central
                {reemplaza ? ' y el PDF anterior se reemplaza' : ''}.
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

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!subir.isPending) setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={handleDrop}
              disabled={subir.isPending}
              className={[
                'w-full flex flex-col items-center justify-center py-8 px-3 rounded-lg border-2 border-dashed text-center transition-colors motion-reduce:transition-none',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-60',
                arrastrando
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 dark:border-gray-700',
              ].join(' ')}
            >
              <FileUp
                className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground font-medium">
                {archivo
                  ? 'Elegir otro PDF'
                  : 'Elegir o arrastrar el PDF firmado'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Solo PDF · máximo 20 MB
              </p>
            </button>

            {archivo && (
              <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
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
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="min-w-0 rounded-lg border border-border overflow-hidden bg-muted/30">
            {vistaPrevia ? (
              <iframe
                src={`${vistaPrevia}#view=Fit&zoom=60`}
                title={`Vista previa de ${archivo?.name ?? 'el PDF firmado'}`}
                className="w-full h-[50vh] md:h-[65vh] border-0"
              />
            ) : (
              <div className="flex h-[30vh] md:h-[65vh] flex-col items-center justify-center gap-2 px-6 text-center">
                <FileSearch
                  className="h-8 w-8 text-gray-300 dark:text-gray-600"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  Aquí verás el PDF en cuanto lo elijas, para confirmar que es
                  el acta correcta antes de subirla.
                </p>
              </div>
            )}
          </div>
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
