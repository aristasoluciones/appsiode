'use client';

import { Ban, Eye, FileCheck2, FilePlus2, Replace } from 'lucide-react';
import type { IEstudioAvanceDistrito } from '@/types/mecanismos';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BotonAccion } from '@/components/common/boton-accion';
import { EstadoVacio } from '@/components/common/estado-vacio';
import {
  EstudioBadge,
  EstudioDocumentos,
  type TCualDocumento,
} from './estudio-card';

export interface EstudiosAvancePermisos {
  proponer: boolean;
  aprobar: boolean;
  anular: boolean;
}

interface EstudiosAvanceTableProps {
  distritos: IEstudioAvanceDistrito[];
  isLoading: boolean;
  hayFiltros: boolean;
  onLimpiarFiltros: () => void;
  permisos: EstudiosAvancePermisos;
  onProponer: (d: IEstudioAvanceDistrito) => void;
  onReemplazar: (d: IEstudioAvanceDistrito) => void;
  onAprobar: (d: IEstudioAvanceDistrito) => void;
  onAnular: (d: IEstudioAvanceDistrito) => void;
  onVerDetalle: (d: IEstudioAvanceDistrito) => void;
  onVerDocumento: (d: IEstudioAvanceDistrito, cual: TCualDocumento) => void;
  documentoPendiente: { id: number; cual: TCualDocumento } | null;
  /** Acciones del encabezado (proponer, exportar). */
  acciones?: React.ReactNode;
}

function BarraAcuses({
  etiqueta,
  valor,
  total,
}: {
  etiqueta: string;
  valor: number;
  total: number;
}) {
  const pct = total ? Math.round((100 * valor) / total) : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[0.6875rem] text-muted-foreground">
        <span>{etiqueta}</span>
        <span className="tabular-nums">
          {valor}/{total}
        </span>
      </div>
      <Progress
        value={pct}
        className="h-1.5"
        indicatorClassName={pct === 100 ? 'bg-green-600' : 'bg-primary'}
      />
    </div>
  );
}

/** Botones de oficina central según el estatus del estudio del distrito. */
function Acciones({
  d,
  permisos,
  onProponer,
  onReemplazar,
  onAprobar,
  onAnular,
  onVerDetalle,
}: Pick<
  EstudiosAvanceTableProps,
  | 'permisos'
  | 'onProponer'
  | 'onReemplazar'
  | 'onAprobar'
  | 'onAnular'
  | 'onVerDetalle'
> & { d: IEstudioAvanceDistrito }) {
  const listoParaAprobar =
    d.estatus === 'PROPUESTO' &&
    d.consejos > 0 &&
    d.acuses_etapa1 === d.consejos;
  return (
    <div className="flex items-center justify-end gap-1">
      {permisos.proponer && !d.cargado && (
        <BotonAccion etiqueta="Proponer estudio" onClick={() => onProponer(d)}>
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
        </BotonAccion>
      )}
      {permisos.proponer && d.estatus === 'PROPUESTO' && (
        <BotonAccion
          etiqueta="Reemplazar documento"
          onClick={() => onReemplazar(d)}
        >
          <Replace className="h-4 w-4" aria-hidden="true" />
        </BotonAccion>
      )}
      {permisos.aprobar && d.estatus === 'PROPUESTO' && (
        <BotonAccion
          etiqueta={
            listoParaAprobar
              ? 'Aprobar estudio'
              : 'Faltan acuses de la propuesta para aprobar'
          }
          onClick={() => onAprobar(d)}
          disabled={!listoParaAprobar}
        >
          <FileCheck2 className="h-4 w-4 text-success" aria-hidden="true" />
        </BotonAccion>
      )}
      {permisos.anular && d.cargado && (
        <BotonAccion etiqueta="Anular estudio" onClick={() => onAnular(d)}>
          <Ban className="h-4 w-4 text-destructive" aria-hidden="true" />
        </BotonAccion>
      )}
      {d.id && (
        <BotonAccion etiqueta="Ver detalle" onClick={() => onVerDetalle(d)}>
          <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
        </BotonAccion>
      )}
    </div>
  );
}

/** Los 13 distritos federales con su estudio, sus acuses y las acciones de oficina central. */
export function EstudiosAvanceTable(props: EstudiosAvanceTableProps) {
  const {
    distritos,
    isLoading,
    hayFiltros,
    onLimpiarFiltros,
    onVerDocumento,
    documentoPendiente,
    acciones,
  } = props;

  return (
    <div className="rounded-lg border border-border bg-card">
      {acciones && (
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-end gap-2">
          {acciones}
        </div>
      )}

      {!isLoading && distritos.length === 0 && (
        <EstadoVacio
          titulo={hayFiltros ? 'Sin resultados' : 'Sin distritos federales'}
          descripcion={
            hayFiltros
              ? 'Ningún distrito coincide con los filtros.'
              : 'El marco geográfico no tiene distritos federales.'
          }
          busqueda={hayFiltros}
          onLimpiar={onLimpiarFiltros}
        />
      )}

      {(isLoading || distritos.length > 0) && (
        <>
          <div className="md:hidden p-3 space-y-3">
            {isLoading
              ? Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-44 rounded-lg" />
                ))
              : distritos.map((d) => (
                  <article
                    key={d.id_df}
                    className="border border-border rounded-lg p-4 space-y-3 bg-card"
                  >
                    <header className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Distrito federal {d.id_df}
                        </p>
                        <h3 className="text-base font-semibold text-foreground mt-0.5 truncate">
                          {d.df}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {d.consejos} consejos ({d.consejos_d} distritales,{' '}
                          {d.consejos_m} municipales)
                        </p>
                      </div>
                      <EstudioBadge estatus={d.estatus} />
                    </header>
                    {d.id && (
                      <div className="space-y-2">
                        <BarraAcuses
                          etiqueta="Acuses de la propuesta"
                          valor={d.acuses_etapa1}
                          total={d.consejos}
                        />
                        <BarraAcuses
                          etiqueta="Acuses de la aprobación"
                          valor={d.acuses_etapa2}
                          total={d.consejos}
                        />
                        <EstudioDocumentos
                          tienePropuesta={!!d.fecha_propuesta}
                          tieneAprobada={!!d.fecha_aprobacion}
                          fechaPropuesta={d.fecha_propuesta}
                          fechaAprobada={d.fecha_aprobacion}
                          onVer={(cual) => onVerDocumento(d, cual)}
                          pendiente={
                            documentoPendiente?.id === d.id
                              ? documentoPendiente.cual
                              : null
                          }
                          compacto
                        />
                      </div>
                    )}
                    <footer className="pt-2 border-t border-border">
                      <Acciones d={d} {...props} />
                    </footer>
                  </article>
                ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[1100px]">
              <div className="grid grid-cols-12 gap-2 items-center py-2 px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40">
                <div className="col-span-3">Distrito federal</div>
                <div>Estatus</div>
                <div className="text-center">Consejos</div>
                <div className="col-span-2">Acuses de la propuesta</div>
                <div className="col-span-2">Acuses de la aprobación</div>
                <div className="col-span-2">Documentos</div>
                <div className="text-right">Acciones</div>
              </div>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-2 items-center py-3 px-3"
                    >
                      <Skeleton className="col-span-3 h-4 w-40" />
                      {Array.from({ length: 9 }, (_, j) => (
                        <Skeleton key={j} className="h-4 w-full" />
                      ))}
                    </div>
                  ))
                : distritos.map((d) => (
                    <div
                      key={d.id_df}
                      className="grid grid-cols-12 gap-2 items-center py-2 px-3 text-sm border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
                    >
                      <div className="col-span-3 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {d.id_df}. {d.df}
                        </p>
                        <p className="text-[0.6875rem] text-muted-foreground mt-0.5">
                          {d.consejos_d} distritales · {d.consejos_m}{' '}
                          municipales
                        </p>
                      </div>
                      <div>
                        <EstudioBadge estatus={d.estatus} />
                      </div>
                      <div className="text-center tabular-nums">
                        {d.consejos}
                      </div>
                      <div className="col-span-2 pr-2">
                        {d.id ? (
                          <BarraAcuses
                            etiqueta=""
                            valor={d.acuses_etapa1}
                            total={d.consejos}
                          />
                        ) : (
                          '—'
                        )}
                      </div>
                      <div className="col-span-2 pr-2">
                        {d.id && d.estatus !== 'PROPUESTO' ? (
                          <BarraAcuses
                            etiqueta=""
                            valor={d.acuses_etapa2}
                            total={d.consejos}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                      <div className="col-span-2">
                        {d.id ? (
                          <EstudioDocumentos
                            tienePropuesta={!!d.fecha_propuesta}
                            tieneAprobada={!!d.fecha_aprobacion}
                            fechaPropuesta={d.fecha_propuesta}
                            fechaAprobada={d.fecha_aprobacion}
                            onVer={(cual) => onVerDocumento(d, cual)}
                            pendiente={
                              documentoPendiente?.id === d.id
                                ? documentoPendiente.cual
                                : null
                            }
                            compacto
                          />
                        ) : (
                          '—'
                        )}
                      </div>
                      <Acciones d={d} {...props} />
                    </div>
                  ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
