'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, X } from 'lucide-react';
import type { IMecanismoSeguimiento } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { formatMoneda } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EstadoVacio } from '@/components/common/estado-vacio';
import { PaginacionSimple } from '@/components/common/paginacion-simple';

/** Filtro por estado del informe: todos los mecanismos informados, o con pendientes. */
export type TFiltroInforme = 'informados' | 'sin_informar' | 'sin_mecanismos';

/** Un consejo está «informado» cuando todos sus mecanismos tienen informe. */
export function consejoInformado(c: IMecanismoSeguimiento) {
  return c.mecanismos > 0 && c.sin_informar === 0;
}

interface SeguimientoTableProps {
  data: IMecanismoSeguimiento[];
  isLoading: boolean;
  tipoConsejo: 'D' | 'M';
  filtroInforme: TFiltroInforme | null;
  onLimpiarFiltro: () => void;
  /** Acciones del encabezado (botones de oficina central). */
  acciones?: React.ReactNode;
}

function rutaConsejo(c: IMecanismoSeguimiento) {
  return `/mecanismos/consejos/${c.tipo_consejo === 'D' ? 'distritales' : 'municipales'}/${c.id_consejo}`;
}

function Porcentaje({ valor }: { valor: number }) {
  const tono = valor >= 100 ? 'success' : valor > 0 ? 'warning' : 'secondary';
  return (
    <Badge variant={tono} appearance="light" size="sm" className="tabular-nums">
      {valor}%
    </Badge>
  );
}

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
      if (filtroInforme === 'informados' && !consejoInformado(c)) return false;
      if (filtroInforme === 'sin_informar' && c.sin_informar === 0)
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
                  <Skeleton key={i} className="h-36 rounded-lg" />
                ))
              : paginados.map((c) => (
                  <Link
                    key={c.id_consejo}
                    href={rutaConsejo(c)}
                    className="block"
                  >
                    <article className="border border-border rounded-lg p-4 space-y-3 bg-card">
                      <header className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            #{c.id_consejo} · {tipoTexto}
                          </p>
                          <h3 className="text-base font-semibold text-foreground mt-0.5 truncate">
                            {c.consejo}
                          </h3>
                        </div>
                        <Porcentaje valor={c.porcentaje_informados} />
                      </header>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          ['Mecanismos', c.mecanismos],
                          ['Informados', c.informados],
                          ['Con CAE', c.con_cae],
                        ].map(([l, v]) => (
                          <div key={l} className="rounded-md p-2 bg-muted/50">
                            <span className="block text-base font-bold tabular-nums">
                              {v}
                            </span>
                            <span className="text-[0.625rem] text-muted-foreground">
                              {l}
                            </span>
                          </div>
                        ))}
                      </div>
                      <footer className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                        <span>
                          Costo estimado {formatMoneda(c.costo_estimado)}
                        </span>
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </footer>
                    </article>
                  </Link>
                ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-12 gap-2 items-center py-2 px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40">
                <div className="col-span-3">Consejo</div>
                <div className="text-center">Mecanismos</div>
                <div className="text-center">DAT</div>
                <div className="text-center">CRyT</div>
                <div className="text-center">Informados</div>
                <div className="text-center">Avance</div>
                <div
                  className="text-center"
                  title="Mecanismos que informa el consejo con CAE asignado"
                >
                  Con CAE
                </div>
                <div
                  className="text-right"
                  title="Suma del costo estimado de los mecanismos que informa el consejo"
                >
                  Costo estimado
                </div>
                <div className="col-span-2 text-right">Último informe</div>
              </div>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-2 items-center py-2 px-3"
                    >
                      <div className="col-span-3 space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      {Array.from({ length: 7 }, (_, j) => (
                        <Skeleton key={j} className="h-4 w-10 mx-auto" />
                      ))}
                      <Skeleton className="col-span-2 h-3 w-28 ml-auto" />
                    </div>
                  ))
                : paginados.map((c) => (
                    <div
                      key={c.id_consejo}
                      className="grid grid-cols-12 gap-2 items-center py-2 px-3 text-sm border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
                    >
                      <div className="col-span-3 min-w-0">
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
                      <div className="text-center tabular-nums">{c.dat}</div>
                      <div className="text-center tabular-nums">
                        {c.cryt_fijo + c.cryt_itinerante}
                      </div>
                      <div className="text-center tabular-nums">
                        {c.informados}
                        <span className="text-xs text-muted-foreground">
                          {' '}
                          / {c.sin_informar}
                        </span>
                      </div>
                      <div className="text-center">
                        <Porcentaje valor={c.porcentaje_informados} />
                      </div>
                      <div className="text-center tabular-nums">
                        {c.con_cae}
                      </div>
                      <div className="text-right tabular-nums">
                        {formatMoneda(c.costo_estimado)}
                      </div>
                      <div className="col-span-2 text-right text-xs text-muted-foreground">
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
