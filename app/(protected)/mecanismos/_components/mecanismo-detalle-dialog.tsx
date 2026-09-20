'use client';

import type { IMecanismo } from '@/types/mecanismos';
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
import { useMecanismo } from '../_hooks/use-mecanismos';
import { claveMecanismo, nombreConsejo } from '../_lib/estatus';
import { HistorialMecanismo } from './historial-mecanismo';
import { CedulaBadge } from './mecanismo-card';

interface MecanismoDetalleDialogProps {
  idMecanismo: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Botones de oficina central (editar, observaciones, estatus); reciben el mecanismo cargado. */
  acciones?: (m: IMecanismo) => React.ReactNode;
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
      <p className="text-sm text-foreground">{children ?? '—'}</p>
    </div>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{titulo}</h3>
      {children}
    </section>
  );
}

/** Ficha completa del mecanismo: ruta, casillas, consejos con su informe, cédula e historial. */
export function MecanismoDetalleDialog({
  idMecanismo,
  open,
  onOpenChange,
  acciones,
}: MecanismoDetalleDialogProps) {
  const { data, isLoading, isError, refetch } = useMecanismo(
    open ? idMecanismo : null,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{data ? claveMecanismo(data) : 'Mecanismo'}</DialogTitle>
          <DialogDescription>
            {data
              ? `${data.tipo_desc} del distrito federal ${data.df ?? data.id_df}${data.activo ? '' : ' · inactivo'}`
              : 'Detalle del mecanismo de recolección.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {isError ? (
            <ErrorState
              title="No se pudo cargar el mecanismo."
              onRetry={() => refetch()}
            />
          ) : isLoading || !data ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <Detalle m={data} />
          )}
        </DialogBody>

        <DialogFooter className="sm:justify-between">
          <div className="flex flex-wrap gap-2">{data && acciones?.(data)}</div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Detalle({ m }: { m: IMecanismo }) {
  return (
    <>
      <Seccion titulo="Ruta">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Dato etiqueta="Distancia">
            {m.distancia_km != null ? `${m.distancia_km} km` : null}
          </Dato>
          <Dato etiqueta="Tiempo de recorrido">{m.tiempo_recorrido}</Dato>
          <Dato etiqueta="Elección atendida">{m.eleccion_atendida}</Dato>
          <Dato etiqueta="Responsable de la cotización">
            {nombreConsejo(
              m.cotizacion_tipo_consejo,
              m.cotizacion_id_consejo,
              m.cotizacion_consejo,
            )}
          </Dato>
        </div>
        {m.visualizacion && (
          <p className="text-xs text-muted-foreground">
            Visualización del INE: {m.visualizacion}
          </p>
        )}
      </Seccion>

      <Seccion titulo={`Casillas (${m.total_casillas})`}>
        {m.casillas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin casillas registradas.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {m.casillas.map((c) => (
              <Badge
                key={c.id}
                variant={c.en_catalogo ? 'secondary' : 'warning'}
                appearance="light"
                size="sm"
                title={`${c.municipio ?? 'Municipio ' + c.id_mun}${c.en_catalogo ? '' : ' · no está en el catálogo de casillas'}`}
              >
                {c.seccion} {c.casilla_tipo}
              </Badge>
            ))}
          </div>
        )}
      </Seccion>

      <Seccion titulo="Consejos vinculados">
        <div className="space-y-2">
          {m.consejos.map((c) => (
            <div
              key={c.id}
              className="rounded-md border border-border p-3 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {nombreConsejo(c.tipo_consejo, c.id_consejo, c.consejo)}
                </span>
                {c.revisa_mecanismo && (
                  <Badge variant="primary" appearance="light" size="sm">
                    Informa el mecanismo
                  </Badge>
                )}
                <Badge
                  variant={c.fecha_informe ? 'success' : 'secondary'}
                  appearance="light"
                  size="sm"
                >
                  {c.informe_estatus_desc}
                </Badge>
              </div>
              {c.revisa_mecanismo && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Dato etiqueta="CAE">
                    {c.cae_folio ? `${c.cae_folio} · ${c.cae_nombre}` : null}
                  </Dato>
                  <Dato etiqueta="Costo estimado">
                    {c.costo_estimado != null
                      ? formatMoneda(c.costo_estimado)
                      : null}
                  </Dato>
                  <Dato etiqueta="Informado">
                    {c.fecha_informe ? formatFechaHora(c.fecha_informe) : null}
                  </Dato>
                  {c.observaciones_informe && (
                    <div className="col-span-full">
                      <Dato etiqueta="Observaciones">
                        {c.observaciones_informe}
                      </Dato>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Cédula">
        <div className="flex flex-wrap items-center gap-2">
          <CedulaBadge m={m} />
          {m.fecha_propuesta && (
            <span className="text-xs text-muted-foreground">
              Propuesta {formatFechaHora(m.fecha_propuesta)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Dato etiqueta="Costo INE">
            {m.costo_ine != null ? formatMoneda(m.costo_ine) : null}
          </Dato>
          <Dato etiqueta="Costo autorizado">
            {m.costo_autorizado != null
              ? formatMoneda(m.costo_autorizado)
              : null}
          </Dato>
          <Dato etiqueta="Aprobada">
            {m.fecha_aprobacion ? formatFechaHora(m.fecha_aprobacion) : null}
          </Dato>
        </div>
        {m.motivo_anulacion && (
          <p className="text-sm text-destructive">
            Anulada {formatFechaHora(m.fecha_anulacion)}: {m.motivo_anulacion}
          </p>
        )}
      </Seccion>

      {m.observaciones_admin && (
        <Seccion titulo="Observaciones de oficina central">
          <p className="text-sm text-foreground whitespace-pre-line">
            {m.observaciones_admin}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFechaHora(m.observaciones_admin_fecha)}
          </p>
        </Seccion>
      )}

      <HistorialMecanismo historial={m.historial ?? []} />
    </>
  );
}
