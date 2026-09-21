'use client';

import { formatFechaHora } from '@/lib/fechas';
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { TextoExpandible } from '@/components/common/texto-expandible';
import { useEstudio } from '../_hooks/use-estudios';
import { nombreConsejo } from '../_lib/estatus';
import { EstudioBadge } from './estudio-card';
import { HistorialMecanismo } from './historial-mecanismo';

interface EstudioDetalleDialogProps {
  idEstudio: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Fecha({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string | null;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className="text-sm text-foreground">
        {valor ? formatFechaHora(valor) : '—'}
      </p>
    </div>
  );
}

/** Ficha del estudio: fechas, el acuse de cada consejo del distrito (o solo el propio) y el historial. */
export function EstudioDetalleDialog({
  idEstudio,
  open,
  onOpenChange,
}: EstudioDetalleDialogProps) {
  const {
    data: e,
    isLoading,
    isError,
    refetch,
  } = useEstudio(open ? idEstudio : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {e
              ? `Estudio de factibilidad · ${e.df}`
              : 'Estudio de factibilidad'}
          </DialogTitle>
          <DialogDescription>
            {e
              ? `Distrito federal ${e.id_df} · ${e.acuses_etapa1} de ${e.consejos} acuses de la propuesta y ${e.acuses_etapa2} de la aprobación`
              : 'Detalle del estudio del distrito federal.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {isError ? (
            <ErrorState
              title="No se pudo cargar el estudio."
              onRetry={() => refetch()}
            />
          ) : isLoading || !e ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <section className="space-y-3">
                <EstudioBadge estatus={e.estatus} />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Fecha etiqueta="Propuesto" valor={e.fecha_propuesta} />
                  <Fecha etiqueta="Aprobado" valor={e.fecha_aprobacion} />
                  <Fecha etiqueta="Cerrado" valor={e.fecha_cierre} />
                  <Fecha etiqueta="Anulado" valor={e.fecha_anulacion} />
                </div>
                {e.motivo_anulacion && (
                  <p className="text-sm text-destructive">
                    Motivo de anulación: {e.motivo_anulacion}
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {e.acuses.length === 1
                    ? 'Acuses del consejo'
                    : 'Acuses por consejo'}
                </h3>
                <ScrollArea viewportClassName="max-h-72 pr-3">
                  <div className="space-y-2">
                    {e.acuses.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-md border border-border p-3 space-y-2"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {nombreConsejo(
                            a.tipo_consejo,
                            a.id_consejo,
                            a.consejo,
                          )}
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {(
                            [
                              [
                                'Propuesta',
                                a.fecha_etapa1,
                                a.observaciones_etapa1,
                              ],
                              [
                                'Aprobación',
                                a.fecha_etapa2,
                                a.observaciones_etapa2,
                              ],
                            ] as const
                          ).map(([titulo, fecha, obs]) => (
                            <div key={titulo} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {titulo}
                                </span>
                                <Badge
                                  variant={fecha ? 'success' : 'secondary'}
                                  appearance="light"
                                  size="sm"
                                >
                                  {fecha ? 'Acusado' : 'Pendiente'}
                                </Badge>
                              </div>
                              {fecha && (
                                <p className="text-xs text-muted-foreground">
                                  {formatFechaHora(fecha)}
                                </p>
                              )}
                              {obs && (
                                <p className="text-sm text-foreground text-justify">
                                  <TextoExpandible texto={obs} />
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </section>

              <HistorialMecanismo
                historial={e.historial}
                titulo="Historial del estudio"
              />
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
