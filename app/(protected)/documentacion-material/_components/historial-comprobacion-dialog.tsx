'use client';

import { History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatFechaHora } from '@/lib/fechas';
import { useComprobacionHistorial } from '../_hooks/use-comprobaciones';
import type { IComprobacionDocumento } from '@/types/material-electoral';

interface HistorialComprobacionDialogProps {
  /** Renglón del que se consulta el rastro; null cuando la ventana está inactiva. */
  documento: IComprobacionDocumento | null;
  idConsejo: number;
  tipoConsejo: 'D' | 'M';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Rastro de capturas de un renglón: cada corrección queda con su autor. */
export function HistorialComprobacionDialog({
  documento,
  idConsejo,
  tipoConsejo,
  open,
  onOpenChange,
}: HistorialComprobacionDialogProps) {
  const { data, isLoading } = useComprobacionHistorial(
    open ? (documento?.id ?? null) : null,
    tipoConsejo,
    idConsejo,
  );

  const capturas = data?.capturas ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Historial de capturas</DialogTitle>
          <DialogDescription>
            {documento?.desc_documento ?? ''}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ) : capturas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <History className="h-8 w-8 text-gray-400 mb-3" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Este renglón todavía no tiene capturas registradas.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-3">
            <ol className="space-y-3">
              {capturas.map((captura, indice) => (
                <li
                  key={captura.id}
                  className="rounded-md border border-border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {captura.cantidad_fisica} piezas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFechaHora(captura.fecha_registro)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {indice === 0 && (
                        <Badge variant="info" appearance="light" size="sm">
                          Vigente
                        </Badge>
                      )}
                      <Badge
                        variant={
                          captura.diferencia === 0 ? 'success' : 'warning'
                        }
                        appearance="light"
                        size="sm"
                      >
                        {captura.diferencia > 0
                          ? `+${captura.diferencia}`
                          : captura.diferencia}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Capturó: {captura.usuario?.trim() || 'No disponible'}
                  </p>
                  {captura.observaciones && captura.observaciones !== '-' && (
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {captura.observaciones}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
