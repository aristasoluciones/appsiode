'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface VisorPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descripcion?: string;
  /** URL firmada del PDF; nula mientras se resuelve. */
  url: string | null;
  /** La URL firmada todavía se está pidiendo al API. */
  cargando?: boolean;
}

/**
 * Visor de PDF en ventana. Recibe una URL firmada en línea (Content-Disposition
 * inline), que el iframe muestra directo sin pasar por el servidor de Next.
 */
export function VisorPdfDialog({
  open,
  onOpenChange,
  titulo,
  descripcion,
  url,
  cargando = false,
}: VisorPdfDialogProps) {
  const src = url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[95vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border shrink-0 flex-row items-center justify-between gap-3 space-y-0">
          <div className="min-w-0">
            <DialogTitle className="text-sm font-semibold truncate">
              {titulo}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {descripcion ?? 'Documento PDF'}
            </DialogDescription>
          </div>
          {src && (
            <Button variant="outline" size="sm" asChild className="mr-8">
              <a href={src} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Abrir en pestaña
              </a>
            </Button>
          )}
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {src && !cargando ? (
            <iframe
              src={`${src}#view=Fit&zoom=60`}
              title={titulo}
              className="w-full h-full border-0"
              style={{ minHeight: '70vh' }}
            />
          ) : (
            <div
              className="p-4"
              aria-busy="true"
              aria-label="Cargando el documento"
            >
              <Skeleton className="w-full" style={{ minHeight: '70vh' }} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
