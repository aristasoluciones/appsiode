'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CircleAlert,
  ExternalLink,
  FileCheck2,
  FileText,
  Loader2,
  Replace,
  X,
} from 'lucide-react';
import type { IEstudioAvanceDistrito } from '@/types/mecanismos';
import { pesoLegible, validarArchivo } from '@/lib/archivos';
import { formatFechaHora } from '@/lib/fechas';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import {
  useDocumentoEstudio,
  useReemplazarPropuestaEstudio,
} from '../_hooks/use-estudios';
import { MECANISMOS_LIMITES } from '../_lib/limites';
import type { TCualDocumento } from './estudio-badges';

interface DocumentosEstudioDialogProps {
  distrito: IEstudioAvanceDistrito | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Oficina central con permiso de proponer: puede reemplazar el PDF propuesto. */
  puedeReemplazar: boolean;
}

const PDF = {
  extensiones: ['.pdf'] as const,
  bytes: MECANISMOS_LIMITES.pdf.bytes,
};

/**
 * Documentos del estudio en una sola ventana: abre con la vista previa del PDF
 * propuesto; el aprobado, si existe, se elige arriba. Reemplazar el propuesto previsualiza
 * el nuevo sin guardarlo; solo «Confirmar reemplazo» lo sube, y «Cancelar»
 * regresa al documento vigente.
 */
export function DocumentosEstudioDialog({
  distrito,
  open,
  onOpenChange,
  puedeReemplazar,
}: DocumentosEstudioDialogProps) {
  const reemplazar = useReemplazarPropuestaEstudio();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cual, setCual] = useState<TCualDocumento>('propuesta');
  const [nuevo, setNuevo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tieneAprobada = !!distrito?.fecha_aprobacion;
  const documento = useDocumentoEstudio(
    distrito?.id ?? null,
    cual,
    open && !nuevo,
  );

  // Al abrir se ve la propuesta; el aprobado, si existe, con el selector.
  useEffect(() => {
    if (!open) return;
    setCual('propuesta');
    setNuevo(null);
    setError(null);
  }, [open]);

  // Vista previa local del PDF elegido; se libera al cambiarlo o cerrar.
  const urlNuevo = useMemo(
    () => (nuevo ? URL.createObjectURL(nuevo) : null),
    [nuevo],
  );
  useEffect(
    () => () => {
      if (urlNuevo) URL.revokeObjectURL(urlNuevo);
    },
    [urlNuevo],
  );

  if (!distrito?.id) return null;

  const id = distrito.id;
  const sePuedeReemplazar = puedeReemplazar && distrito.estatus === 'PROPUESTO';
  const guardando = reemplazar.isPending;
  const src = nuevo ? urlNuevo : (documento.data ?? null);

  function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    const mensaje = validarArchivo(archivo, PDF);
    setError(mensaje);
    if (mensaje) return;
    setCual('propuesta');
    setNuevo(archivo);
  }

  function confirmar() {
    if (!nuevo) return;
    reemplazar.mutate(
      { id, archivo: nuevo },
      { onSuccess: () => setNuevo(null) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !guardando && onOpenChange(v)}>
      <DialogContent className="sm:max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border shrink-0 space-y-2">
          <div className="pr-8">
            <DialogTitle className="text-sm font-semibold">
              Documentos del estudio · {distrito.df}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {nuevo
                ? 'Vista previa del documento nuevo: todavía no se guarda.'
                : cual === 'propuesta'
                  ? `Estudio propuesto${distrito.fecha_propuesta ? ` el ${formatFechaHora(distrito.fecha_propuesta)}` : ''}.`
                  : `Estudio aprobado${distrito.fecha_aprobacion ? ` el ${formatFechaHora(distrito.fecha_aprobacion)}` : ''}.`}
            </DialogDescription>
          </div>
          {!nuevo && (
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex rounded-md border border-border p-0.5"
                role="group"
                aria-label="Documento a la vista"
              >
                {(
                  [
                    ['propuesta', 'Propuesta', FileText, true],
                    ['aprobada', 'Aprobada', FileCheck2, tieneAprobada],
                  ] as const
                ).map(([valor, etiqueta, Icono, existe]) => (
                  <Button
                    key={valor}
                    variant={cual === valor ? 'primary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setCual(valor)}
                    disabled={!existe}
                    aria-pressed={cual === valor}
                  >
                    <Icono className="h-3.5 w-3.5" aria-hidden="true" />
                    {etiqueta}
                  </Button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {src && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={src} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Abrir en pestaña
                    </a>
                  </Button>
                )}
                {sePuedeReemplazar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Replace className="h-4 w-4" aria-hidden="true" />
                    Reemplazar propuesta
                  </Button>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={elegir}
              />
            </div>
          )}
          {error && (
            <Alert variant="destructive" appearance="light" close={false}>
              <AlertIcon>
                <CircleAlert />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          {nuevo && (
            <Alert variant="warning" appearance="light" close={false}>
              <AlertIcon>
                <CircleAlert />
              </AlertIcon>
              <AlertTitle>
                {nuevo.name} ({pesoLegible(nuevo.size)}). Al confirmar, los
                consejos que ya lo revisaron vuelven a Sin revisar y deberán
                revisarlo de nuevo; sus observaciones se conservan.
              </AlertTitle>
            </Alert>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted/30">
          {!nuevo && documento.isError ? (
            <ErrorState
              title="No se pudo obtener el documento."
              onRetry={() => documento.refetch()}
            />
          ) : src ? (
            <iframe
              key={src}
              src={`${src}#view=Fit&zoom=60`}
              title={`Estudio ${cual} · ${distrito.df}`}
              className="w-full h-full border-0"
            />
          ) : (
            <div
              className="p-4 h-full"
              aria-busy="true"
              aria-label="Cargando el documento"
            >
              <Skeleton className="w-full h-full" />
            </div>
          )}
        </div>

        <DialogFooter className="px-4 py-3 border-t border-border shrink-0">
          {nuevo ? (
            <>
              <Button
                variant="outline"
                onClick={() => setNuevo(null)}
                disabled={guardando}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Cancelar
              </Button>
              <Button
                onClick={confirmar}
                disabled={guardando}
                aria-busy={guardando}
              >
                {guardando ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Replace className="h-4 w-4" aria-hidden="true" />
                )}
                Confirmar reemplazo
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
