'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import type { IMecanismoSeguimiento } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EstadoVacio } from '@/components/common/estado-vacio';
import { PaginacionSimple } from '@/components/common/paginacion-simple';
import { TIPO_MECANISMO_CORTO } from '../_lib/estatus';
import { MontoCosto } from './mecanismo-celdas';
import { Porcentaje, rutaConsejo, SeguimientoCard } from './seguimiento-card';

/**
 * Filtro del tablero por consejo: solo si tiene mecanismos o no. Revisiones y
 * cédulas pueden ser parciales dentro de un consejo; se leen en sus columnas y
 * en su vista, no como filtro.
 */
export type TFiltroInforme = 'con_mecanismos' | 'sin_mecanismos';

interface SeguimientoTableProps {
  data: IMecanismoSeguimiento[];
  isLoading: boolean;
  tipoConsejo: 'D' | 'M';
  filtroInforme: TFiltroInforme | null;
  onLimpiarFiltro: () => void;
  /** Acciones del encabezado (botones de oficina central). */
  acciones?: React.ReactNode;
}

const COLUMNAS =
  'grid grid-cols-[3fr_repeat(3,1fr)_3fr_3fr_2fr_1.6fr] gap-2 items-center';

/** Recuadros de los grupos, como en comprobaciones físicas: Tipos con borde, Integración sombreada. */
const GRUPO_TIPOS = 'border border-border bg-background';
const GRUPO_INTEGRACION = 'bg-muted/50';

/** Un consejo del tipo por renglón, aunque vaya en ceros; el nombre lleva a su vista. */
export function SeguimientoTable({
  data,
  isLoading,
  tipoConsejo,
  filtroInforme,
  onLimpiarFiltro,
  acciones,
}: SeguimientoTableProps) {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [tamano, setTamano] = useState(30);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return data.filter((c) => {
      if (filtroInforme === 'con_mecanismos' && c.mecanismos === 0)
        return false;
      if (filtroInforme === 'sin_mecanismos' && c.mecanismos > 0) return false;
      return (
        !q ||
        c.consejo.toLowerCase().includes(q) ||
        String(c.id_consejo).includes(q)
      );
    });
  }, [data, busqueda, filtroInforme]);

  const hayFiltros = busqueda.trim().length > 0 || !!filtroInforme;

  const totalPaginas = Math.ceil(filtrados.length / tamano);
  const paginaSegura = Math.min(pagina, Math.max(totalPaginas, 1));
  const paginados = filtrados.slice(
    (paginaSegura - 1) * tamano,
    paginaSegura * tamano,
  );

  const tipoTexto =
    tipoConsejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal';

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar consejo..."
              disabled={isLoading}
              className="pl-9 pr-9"
              aria-label="Buscar consejo"
            />
            {busqueda && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  setBusqueda('');
                  setPagina(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          {hayFiltros && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {filtrados.length} de {data.length} consejos
            </span>
          )}
        </div>
        {acciones && (
          <div className="flex flex-wrap items-center gap-2">{acciones}</div>
        )}
      </div>

      {!isLoading && data.length === 0 && (
        <EstadoVacio
          titulo="Sin consejos que mostrar"
          descripcion="El proceso no tiene consejos activos de este tipo."
        />
      )}
      {!isLoading && data.length > 0 && filtrados.length === 0 && (
        <EstadoVacio
          titulo="Sin resultados"
          descripcion="Ningún consejo coincide con los filtros."
          busqueda
          onLimpiar={() => {
            setBusqueda('');
            onLimpiarFiltro();
          }}
        />
      )}

      {(isLoading || filtrados.length > 0) && (
        <>
          <div className="md:hidden p-3 space-y-3">
            {isLoading
              ? Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-40 rounded-lg" />
                ))
              : paginados.map((c) => (
                  <SeguimientoCard
                    key={c.id_consejo}
                    c={c}
                    tipoTexto={tipoTexto}
                  />
                ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[1280px]">
              <div
                className={`${COLUMNAS} py-2 px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40`}
              >
                <div>Consejo</div>
                <div className="text-center">No. de mecanismos</div>
                <div
                  className="text-center"
                  title="Revisados de su total de mecanismos"
                >
                  Revisados
                </div>
                <div className="text-center">Avance</div>
                {/* Cada recuadro agrupa sus subcolumnas: la etiqueta arriba y el número alineado debajo. */}
                <EncabezadoGrupo
                  titulo="Mecanismos por tipo"
                  descripcion="Mecanismos que revisa el consejo, por tipo"
                  className={GRUPO_TIPOS}
                  columnas={[
                    TIPO_MECANISMO_CORTO.DAT,
                    TIPO_MECANISMO_CORTO.CRYT_FIJO,
                    TIPO_MECANISMO_CORTO.CRYT_ITINERANTE,
                  ]}
                />
                <EncabezadoGrupo
                  titulo="Mecanismos con"
                  descripcion="Mecanismos con cédula, con al menos una observación y con CAE asignado"
                  className={GRUPO_INTEGRACION}
                  columnas={['Cédula', 'Observaciones', 'CAE']}
                  ayudas={[
                    'Con cédula cargada',
                    'Con al menos una observación',
                    'Con CAE asignado',
                  ]}
                />
                <div title="Total INE: suma del costo del INE de los mecanismos que revisa el consejo. Total consejo: suma de lo que capturó al revisarlos">
                  Costos
                </div>
                <div className="text-right">Última revisión</div>
              </div>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className={`${COLUMNAS} py-2 px-3`}>
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      {Array.from({ length: 6 }, (_, j) => (
                        <Skeleton key={j} className="h-4 w-10 mx-auto" />
                      ))}
                      <Skeleton className="h-3 w-28 ml-auto" />
                    </div>
                  ))
                : paginados.map((c) => (
                    <div
                      key={c.id_consejo}
                      className={`${COLUMNAS} py-2 px-3 text-sm border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors`}
                    >
                      <div className="min-w-0">
                        <Link
                          href={rutaConsejo(c)}
                          className="font-medium text-foreground truncate block hover:text-primary focus-visible:outline-none focus-visible:underline"
                        >
                          {c.id_consejo}. {c.consejo}
                        </Link>
                        <p className="text-[0.6875rem] text-muted-foreground mt-0.5">
                          {tipoTexto}
                        </p>
                      </div>
                      <div className="text-center tabular-nums font-semibold">
                        {c.mecanismos}
                      </div>
                      <div className="text-center tabular-nums">
                        {c.informados}
                        <span className="text-xs text-muted-foreground">
                          {' '}
                          de {c.informados + c.sin_informar}
                        </span>
                      </div>
                      <div className="text-center">
                        <Porcentaje valor={c.porcentaje_informados} />
                      </div>
                      <Grupo className={GRUPO_TIPOS}>
                        <Celda valor={c.dat} />
                        <Celda valor={c.cryt_fijo} />
                        <Celda valor={c.cryt_itinerante} />
                      </Grupo>
                      <Grupo className={GRUPO_INTEGRACION}>
                        <Celda valor={c.con_cedula} />
                        <Celda valor={c.con_observaciones} />
                        <Celda valor={c.con_cae} />
                      </Grupo>
                      <dl className="text-xs space-y-1">
                        <Indicador etiqueta="Total INE">
                          <MontoCosto valor={c.costo_ine} origen="ine" />
                        </Indicador>
                        <Indicador etiqueta="Total consejo">
                          <MontoCosto
                            valor={c.costo_estimado}
                            origen="consejo"
                          />
                        </Indicador>
                      </dl>
                      <div className="text-right text-xs text-muted-foreground">
                        {c.ultimo_informe
                          ? formatFechaHora(c.ultimo_informe)
                          : '—'}
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          <PaginacionSimple
            pagina={paginaSegura}
            totalPaginas={totalPaginas}
            onPaginaChange={setPagina}
            totalRegistros={filtrados.length}
            tamano={tamano}
            onTamanoChange={(t) => {
              setTamano(t);
              setPagina(1);
            }}
            unidad="consejo"
          />
        </>
      )}
    </div>
  );
}

/** Un renglón de la columna de costos: la etiqueta a la izquierda y el monto a la derecha. */
function Indicador({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  );
}

/** Encabezado de un grupo: su título y, dentro del recuadro, la etiqueta de cada subcolumna. */
function EncabezadoGrupo({
  titulo,
  descripcion,
  columnas,
  ayudas,
  className,
}: {
  titulo: string;
  descripcion: string;
  columnas: string[];
  /** Texto completo de cada subcolumna, en su tooltip. */
  ayudas?: string[];
  className: string;
}) {
  return (
    <div title={descripcion} className="space-y-1">
      <p className="text-center">{titulo}</p>
      <div
        className={`grid grid-cols-3 gap-1 rounded-md py-1 px-1 ${className}`}
      >
        {columnas.map((c, i) => (
          <span
            key={c}
            title={ayudas?.[i]}
            className="text-center text-[0.6875rem] leading-tight"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Recuadro de un grupo en el renglón: sus números alineados bajo las etiquetas del encabezado. */
function Grupo({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`grid grid-cols-3 gap-1 rounded-md py-1 px-1 ${className}`}>
      {children}
    </div>
  );
}

/** Número de una subcolumna; el cero en gris tenue. */
function Celda({ valor }: { valor: number }) {
  return (
    <div className="text-center tabular-nums leading-tight">
      <span
        className={
          valor ? 'font-semibold text-foreground' : 'text-muted-foreground/60'
        }
      >
        {valor}
      </span>
    </div>
  );
}
