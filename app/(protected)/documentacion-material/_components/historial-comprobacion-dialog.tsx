'use client';

import { ReactNode } from 'react';
import { ClipboardCheck, FileUp, History, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Timeline, TimelineItem, type TTimelineTono } from '@/components/common/timeline';
import { formatFechaHora } from '@/lib/fechas';
import { useComprobacionHistorial } from '../_hooks/use-comprobaciones';
import type {
  IComprobacionDocumento,
  IComprobacionEvento,
} from '@/types/material-electoral';

interface HistorialComprobacionDialogProps {
  /** Renglón del que se consulta el rastro; null cuando la ventana está inactiva. */
  documento: IComprobacionDocumento | null;
  idConsejo: number;
  tipoConsejo: 'D' | 'M';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Marcador de cada hito: icono y color según lo que ocurrió con el renglón. */
const MARCADORES: Record<
  IComprobacionEvento['tipo'],
  { icono: ReactNode; tono: TTimelineTono }
> = {
  CARGA_INICIAL: { icono: <FileUp />, tono: 'primario' },
  ACTUALIZACION: { icono: <RefreshCw />, tono: 'info' },
  COMPROBACION: { icono: <ClipboardCheck />, tono: 'neutro' },
};

function marcador(evento: IComprobacionEvento) {
  const base = MARCADORES[evento.tipo] ?? {
    icono: <History />,
    tono: 'neutro' as TTimelineTono,
  };
  // La comprobación se colorea por su resultado: cuadra o hay diferencia.
  if (evento.tipo === 'COMPROBACION') {
    return {
      ...base,
      tono: (evento.diferencia === 0 ? 'exito' : 'advertencia') as TTimelineTono,
    };
  }
  return base;
}

function piezas(cantidad: number | null) {
  return `${cantidad ?? 0} ${cantidad === 1 ? 'pieza' : 'piezas'}`;
}

/**
 * Rastro completo de un renglón: desde el alta con el layout hasta la última
 * comprobación física del consejo, del evento más reciente al más antiguo.
 */
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

  // La línea de tiempo la arma el servidor, ya ordenada de lo más reciente a
  // lo más antiguo y con la comprobación vigente marcada.
  const eventos = data?.eventos ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[85vh] sm:w-full sm:max-w-xl lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historial de comprobaciones</DialogTitle>
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
        ) : eventos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <History className="h-8 w-8 text-gray-400 mb-3" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Este renglón todavía no tiene movimientos registrados.
            </p>
          </div>
        ) : (
          <div className="max-h-[65vh] min-h-0 flex-1 overflow-y-auto pr-3">
            <Timeline className="pt-1">
              {eventos.map((evento, indice) => {
                const { icono, tono } = marcador(evento);
                return (
                  <TimelineItem
                    key={`${evento.tipo}-${evento.id_captura ?? evento.id_importacion ?? indice}`}
                    icono={icono}
                    tono={tono}
                    titulo={
                      <span className="flex flex-wrap items-center gap-2">
                        {evento.evento}
                        {evento.vigente && (
                          <Badge variant="success" appearance="light" size="sm">
                            Vigente
                          </Badge>
                        )}
                      </span>
                    }
                    fecha={formatFechaHora(evento.fecha)}
                  >
                    {evento.tipo === 'COMPROBACION' ? (
                      <>
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                          {piezas(evento.cantidad_fisica)}
                          <Badge
                            variant={
                              evento.diferencia === 0 ? 'success' : 'warning'
                            }
                            appearance="light"
                            size="sm"
                          >
                            {(evento.diferencia ?? 0) > 0
                              ? `+${evento.diferencia}`
                              : evento.diferencia}
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Capturó: {evento.usuario?.trim() || 'No disponible'}
                        </p>
                        {evento.observaciones &&
                          evento.observaciones !== '-' && (
                            <p className="text-sm text-foreground whitespace-pre-line text-justify hyphens-auto">
                              {evento.observaciones}
                            </p>
                          )}
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground">
                          {evento.tipo === 'ACTUALIZACION'
                            ? `Entregadas: ${piezas(evento.cantidad_anterior)} → ${piezas(evento.cantidad)}`
                            : `Entregadas: ${piezas(evento.cantidad)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {evento.tipo === 'ACTUALIZACION'
                            ? 'Actualizó: '
                            : 'Cargó: '}
                          {evento.usuario?.trim() || 'No disponible'}
                        </p>
                        {evento.archivo && (
                          <p className="text-xs text-muted-foreground break-all">
                            Archivo: {evento.archivo}
                          </p>
                        )}
                      </>
                    )}
                  </TimelineItem>
                );
              })}
            </Timeline>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
