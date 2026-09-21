'use client';

import type { ICedulaRevision } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { formatMoneda } from '@/lib/helpers';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { TextoExpandible } from '@/components/common/texto-expandible';
import { useCedula } from '../_hooks/use-cedulas';
import { claveMecanismo, nombreConsejo } from '../_lib/estatus';
import { tonoDiferencia } from './cedula-card';
import { HistorialMecanismo } from './historial-mecanismo';
import { CedulaBadge } from './mecanismo-card';

interface CedulaDetalleDialogProps {
  idMecanismo: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className="text-sm text-foreground text-justify">{children ?? '—'}</p>
    </div>
  );
}

const ESTATUS_REVISION: Record<
  ICedulaRevision['estatus'],
  'secondary' | 'info' | 'success'
> = {
  PENDIENTE: 'secondary',
  INFORMADA: 'info',
  ACUSADA: 'success',
};

/** Ficha de la cédula: costos y fechas, la revisión de cada consejo (o solo la propia) y el historial. */
export function CedulaDetalleDialog({
  idMecanismo,
  open,
  onOpenChange,
}: CedulaDetalleDialogProps) {
  const { data, isLoading, isError, refetch } = useCedula(
    open ? idMecanismo : null,
  );
  const m = data?.mecanismo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {m ? `Cédula · ${claveMecanismo(m)}` : 'Cédula'}
          </DialogTitle>
          <DialogDescription>
            {m
              ? `${m.tipo_desc} del distrito federal ${m.df ?? m.id_df}`
              : 'Detalle de la cédula del mecanismo.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {isError ? (
            <ErrorState
              title="No se pudo cargar la cédula."
              onRetry={() => refetch()}
            />
          ) : isLoading || !data || !m ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <section className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CedulaBadge m={m} />
                  {m.fecha_cierre && (
                    <span className="text-xs text-muted-foreground">
                      Cerrada {formatFechaHora(m.fecha_cierre)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Dato etiqueta="Costo INE">
                    {m.costo_ine != null ? formatMoneda(m.costo_ine) : null}
                  </Dato>
                  <Dato etiqueta="Costo autorizado">
                    {m.costo_autorizado != null
                      ? formatMoneda(m.costo_autorizado)
                      : null}
                  </Dato>
                  <Dato etiqueta="Propuesta">
                    {m.fecha_propuesta
                      ? formatFechaHora(m.fecha_propuesta)
                      : null}
                  </Dato>
                  <Dato etiqueta="Aprobada">
                    {m.fecha_aprobacion
                      ? formatFechaHora(m.fecha_aprobacion)
                      : null}
                  </Dato>
                </div>
                {m.motivo_anulacion && (
                  <p className="text-sm text-destructive">
                    Anulada {formatFechaHora(m.fecha_anulacion)}:{' '}
                    {m.motivo_anulacion}
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {data.revisiones.length === 1
                    ? 'Revisión del consejo'
                    : 'Revisión por consejo'}
                </h3>
                {data.revisiones.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-md border border-border p-3 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {nombreConsejo(r.tipo_consejo, r.id_consejo, r.consejo)}
                      </span>
                      <Badge
                        variant={ESTATUS_REVISION[r.estatus]}
                        appearance="light"
                        size="sm"
                      >
                        {r.estatus_desc}
                      </Badge>
                      {r.revisa_mecanismo && (
                        <Badge variant="primary" appearance="light" size="sm">
                          Informa el mecanismo
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {r.captura_costo && (
                        <>
                          <Dato etiqueta="Costo cotizado">
                            {r.costo_cotizado != null
                              ? formatMoneda(r.costo_cotizado)
                              : null}
                          </Dato>
                          <Dato etiqueta="Diferencia">
                            {r.diferencia != null ? (
                              <span className={tonoDiferencia(r.diferencia)}>
                                {r.diferencia > 0 ? '+' : ''}
                                {formatMoneda(r.diferencia)}
                              </span>
                            ) : null}
                          </Dato>
                        </>
                      )}
                      <Dato etiqueta="Informada">
                        {r.fecha_cedula
                          ? formatFechaHora(r.fecha_cedula)
                          : null}
                      </Dato>
                      {r.observaciones_cedula && (
                        <div className="col-span-full">
                          <Dato etiqueta="Observaciones del informe">
                            <TextoExpandible texto={r.observaciones_cedula} />
                          </Dato>
                        </div>
                      )}
                      {r.fecha_acuse && (
                        <div className="col-span-full">
                          <Dato
                            etiqueta={`Acuse · ${formatFechaHora(r.fecha_acuse)}`}
                          >
                            <TextoExpandible
                              texto={
                                r.observaciones_acuse || 'Sin observaciones'
                              }
                            />
                          </Dato>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </section>

              <HistorialMecanismo
                historial={data.historial}
                titulo="Historial de la cédula"
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
