'use client';

import {
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FilePlus2,
  FileText,
} from 'lucide-react';
import type { IEstudioAvanceDistrito } from '@/types/mecanismos';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BotonAccion } from '@/components/common/boton-accion';
import { EstadoVacio } from '@/components/common/estado-vacio';
import { etapaDe, siguientePaso } from '../_lib/etapas-estudio';
import { EstudioBadge } from './estudio-badges';
import {
  ConsejosPorTipo,
  FechaEstudio,
  ObservacionesPorTipo,
  RevisionesPorConsejo,
} from './estudios-avance-celdas';

/** Columnas de la rejilla: distrito, estatus, siguiente paso, revisiones, observaciones y acciones. */
const FILA =
  'grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.1fr)_minmax(0,1.5fr)_minmax(0,2fr)_minmax(0,1.8fr)_auto] gap-3 items-center';

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
  onAprobar: (d: IEstudioAvanceDistrito) => void;
  onAnular: (d: IEstudioAvanceDistrito) => void;
  onVerDetalle: (d: IEstudioAvanceDistrito) => void;
  /** Abre la ventana de documentos (vista previa y reemplazo de la propuesta). */
  onVerDocumentos: (d: IEstudioAvanceDistrito) => void;
  /** Acciones del encabezado (proponer, exportar). */
  acciones?: React.ReactNode;
  /** Búsqueda por distrito, a la izquierda del encabezado de la tabla. */
  buscador?: React.ReactNode;
  /** Con el detalle abierto a la derecha: fichas en lugar de la rejilla, sin scroll horizontal. */
  compacto?: boolean;
  /** Estudio a la vista en el panel; su ficha queda resaltada. */
  seleccionadoId?: number | null;
  /** Clic en una ficha: cambia el estudio del panel. */
  onSeleccionar?: (d: IEstudioAvanceDistrito) => void;
}

/**
 * Lo que sigue con el distrito: el botón principal con texto cuando la acción es
 * de oficina central (Proponer, Aprobar) o, si no, en palabras qué se espera.
 */
function SiguientePaso({
  d,
  permisos,
  onProponer,
  onAprobar,
}: Pick<EstudiosAvanceTableProps, 'permisos' | 'onProponer' | 'onAprobar'> & {
  d: IEstudioAvanceDistrito;
}) {
  const etapa = etapaDe(d);
  if ((etapa === 'SIN_ESTUDIO' || etapa === 'ANULADO') && permisos.proponer) {
    return (
      <Button size="sm" variant="outline" onClick={() => onProponer(d)}>
        <FilePlus2 className="h-4 w-4" aria-hidden="true" />
        Proponer
      </Button>
    );
  }
  if (etapa === 'LISTO' && permisos.aprobar) {
    return (
      <Button size="sm" onClick={() => onAprobar(d)}>
        <FileCheck2 className="h-4 w-4" aria-hidden="true" />
        Aprobar
      </Button>
    );
  }
  return (
    <span
      className={[
        'inline-flex items-center gap-1 text-xs',
        etapa === 'EN_REVISION'
          ? 'text-warning'
          : etapa === 'APROBADO'
            ? 'text-success'
            : 'text-muted-foreground',
      ].join(' ')}
    >
      {etapa === 'APROBADO' && (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {etapa === 'EN_REVISION' && (
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {siguientePaso(d)}
    </span>
  );
}

/** Acciones secundarias de cada distrito, en iconos: anular, documentos y detalle. */
function Acciones({
  d,
  permisos,
  onAnular,
  onVerDetalle,
  onVerDocumentos,
}: Pick<
  EstudiosAvanceTableProps,
  'permisos' | 'onAnular' | 'onVerDetalle' | 'onVerDocumentos'
> & { d: IEstudioAvanceDistrito }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {permisos.anular && d.cargado && (
        <BotonAccion etiqueta="Anular estudio" onClick={() => onAnular(d)}>
          <Ban className="h-4 w-4 text-destructive" aria-hidden="true" />
        </BotonAccion>
      )}
      {d.id && (
        <BotonAccion
          etiqueta="Documentos del estudio"
          onClick={() => onVerDocumentos(d)}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
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

/** Los 13 distritos federales con su estudio, sus revisiones y las acciones de oficina central. */
export function EstudiosAvanceTable(props: EstudiosAvanceTableProps) {
  const {
    distritos,
    isLoading,
    hayFiltros,
    onLimpiarFiltros,
    acciones,
    buscador,
    compacto = false,
    seleccionadoId = null,
    onSeleccionar,
  } = props;

  return (
    <div className="rounded-lg border border-border bg-card">
      {(buscador || acciones) && (
        <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">{buscador}</div>
          <div className="flex flex-wrap items-center gap-2">{acciones}</div>
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
          <div
            className={compacto ? 'p-3 space-y-3' : 'md:hidden p-3 space-y-3'}
          >
            {isLoading
              ? Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-44 rounded-lg" />
                ))
              : distritos.map((d) => (
                  <article
                    key={d.id_df}
                    onClick={
                      compacto && d.id && onSeleccionar
                        ? () => onSeleccionar(d)
                        : undefined
                    }
                    aria-current={seleccionadoId === d.id ? 'true' : undefined}
                    className={[
                      'border rounded-lg p-4 space-y-3 transition-colors',
                      compacto && d.id
                        ? 'cursor-pointer hover:bg-accent/30'
                        : '',
                      seleccionadoId === d.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card',
                    ].join(' ')}
                  >
                    <header className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Distrito federal {d.id_df}
                        </p>
                        <h3 className="text-base font-semibold text-foreground mt-0.5 truncate">
                          {d.df}
                        </h3>
                      </div>
                      <EstudioBadge estatus={d.estatus} />
                    </header>
                    {d.id && (
                      <div className="space-y-2">
                        <ConsejosPorTipo d={d} />
                        <RevisionesPorConsejo d={d} />
                        <ObservacionesPorTipo d={d} />
                      </div>
                    )}
                    {/* Las acciones no cambian el estudio del panel. */}
                    <footer
                      className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SiguientePaso d={d} {...props} />
                      <Acciones d={d} {...props} />
                    </footer>
                  </article>
                ))}
          </div>

          <div
            className={compacto ? 'hidden' : 'hidden md:block overflow-x-auto'}
          >
            <div className="min-w-[1160px]">
              <div
                className={`${FILA} py-2 px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40`}
              >
                <div>Distrito federal</div>
                <div>Estatus</div>
                <div title="Qué sigue con el distrito; el botón es la acción de oficina central">
                  Siguiente paso
                </div>
                <div title="Distritales y municipales que ya marcaron revisado el estudio, de su total">
                  Revisiones por consejo
                </div>
                <div title="Observaciones de los consejos del distrito por tipo; resaltado, el más observado">
                  Observaciones
                </div>
                <div className="text-right">Acciones</div>
              </div>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className={`${FILA} py-3 px-3`}>
                      {Array.from({ length: 6 }, (_, j) => (
                        <Skeleton key={j} className="h-4 w-full" />
                      ))}
                    </div>
                  ))
                : distritos.map((d) => (
                    <div
                      key={d.id_df}
                      className={`${FILA} py-2 px-3 text-sm border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {d.id_df}. {d.df}
                        </p>
                        <div className="mt-1">
                          <ConsejosPorTipo d={d} />
                        </div>
                      </div>
                      <div>
                        <EstudioBadge estatus={d.estatus} />
                        <FechaEstudio d={d} />
                      </div>
                      <div>
                        <SiguientePaso d={d} {...props} />
                      </div>
                      <div className="pr-2">
                        {d.id ? (
                          <RevisionesPorConsejo d={d} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                      <div>
                        <ObservacionesPorTipo d={d} />
                      </div>
                      <div>
                        <Acciones d={d} {...props} />
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
