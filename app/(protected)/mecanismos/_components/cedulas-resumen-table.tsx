'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, X } from 'lucide-react';
import type {
  ICedulasResumenConsejo,
  TCedulaEstatus,
} from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { formatMoneda } from '@/lib/helpers';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EstadoVacio } from '@/components/common/estado-vacio';
import { PaginacionSimple } from '@/components/common/paginacion-simple';
import { ESTATUS_CEDULA } from '../_lib/estatus';
import { tonoDiferencia } from './cedula-card';

/** Columna del resumen por cada estatus de la cédula, en el orden del ciclo. */
export const COLUMNAS_RESUMEN: {
  estatus: TCedulaEstatus;
  campo: keyof ICedulasResumenConsejo;
}[] = [
  { estatus: 'SIN_CEDULA', campo: 'sin_cedula' },
  { estatus: 'PROPUESTA', campo: 'propuestas' },
  { estatus: 'INFORMADA', campo: 'informadas' },
  { estatus: 'APROBADA', campo: 'aprobadas' },
  { estatus: 'CERRADA', campo: 'cerradas' },
  { estatus: 'ANULADA', campo: 'anuladas' },
];

interface CedulasResumenTableProps {
  data: ICedulasResumenConsejo[];
  isLoading: boolean;
  tipoConsejo: 'D' | 'M';
  /** Estatus activos en los chips del tablero; un consejo pasa si tiene alguno. */
  estatusActivos: TCedulaEstatus[];
  onLimpiarFiltro: () => void;
  acciones?: React.ReactNode;
}

function rutaConsejo(c: ICedulasResumenConsejo) {
  return `/mecanismos/cedulas/consejos/${c.tipo_consejo === 'D' ? 'distritales' : 'municipales'}/${c.id_consejo}`;
}

/** Un consejo del tipo por renglón con sus cédulas por estatus; el nombre lleva a sus cédulas. */
export function CedulasResumenTable({
  data,
  isLoading,
  tipoConsejo,
  estatusActivos,
  onLimpiarFiltro,
  acciones,
}: CedulasResumenTableProps) {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [tamano, setTamano] = useState(30);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return data.filter((c) => {
      if (
        estatusActivos.length > 0 &&
        !COLUMNAS_RESUMEN.some(
          (col) =>
            estatusActivos.includes(col.estatus) && Number(c[col.campo]) > 0,
        )
      ) {
        return false;
      }
      return (
        !q ||
        c.consejo.toLowerCase().includes(q) ||
        String(c.id_consejo).includes(q)
      );
    });
  }, [data, busqueda, estatusActivos]);

  const hayFiltros = busqueda.trim().length > 0 || estatusActivos.length > 0;
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
                        <span className="text-lg font-bold text-primary tabular-nums shrink-0">
                          {c.cedulas}
                        </span>
                      </header>
                      <div
                        className="grid grid-cols-3 gap-2"
                        role="list"
                        aria-label="Cédulas por estatus"
                      >
                        {COLUMNAS_RESUMEN.map((col) => (
                          <div
                            key={col.estatus}
                            role="listitem"
                            className="rounded-md p-2 bg-muted/50 text-center"
                          >
                            <span className="block text-base font-bold tabular-nums">
                              {Number(c[col.campo])}
                            </span>
                            <span className="text-[0.625rem] text-muted-foreground leading-tight">
                              {ESTATUS_CEDULA[col.estatus].label}
                            </span>
                          </div>
                        ))}
                      </div>
                      <footer className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                        <span>
                          INE {formatMoneda(c.costo_ine)}
                          {c.captura_costo && (
                            <>
                              {' · Dif. '}
                              <span className={tonoDiferencia(c.diferencia)}>
                                {formatMoneda(c.diferencia)}
                              </span>
                            </>
                          )}
                        </span>
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </footer>
                    </article>
                  </Link>
                ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-12 gap-2 items-center py-2 px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40">
                <div className="col-span-3">Consejo</div>
                <div className="text-center">Cédulas</div>
                <div className="col-span-5 grid grid-cols-6 gap-1 rounded-md border border-border bg-background py-1">
                  {COLUMNAS_RESUMEN.map((col) => (
                    <div key={col.estatus} className="text-center">
                      {ESTATUS_CEDULA[col.estatus].label}
                    </div>
                  ))}
                </div>
                <div className="text-right">Costo INE</div>
                <div className="text-right">Diferencia</div>
                <div className="text-right">Último informe</div>
              </div>
              {isLoading
                ? Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-2 items-center py-2 px-3"
                    >
                      <div className="col-span-3 space-y-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      {Array.from({ length: 9 }, (_, j) => (
                        <Skeleton key={j} className="h-4 w-8 mx-auto" />
                      ))}
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
                          {c.pendientes_de_informar > 0 &&
                            ` · ${c.pendientes_de_informar} por informar`}
                          {c.pendientes_de_acusar > 0 &&
                            ` · ${c.pendientes_de_acusar} por acusar`}
                        </p>
                      </div>
                      <div className="text-center tabular-nums font-semibold text-primary">
                        {c.cedulas}
                      </div>
                      <div className="col-span-5 grid grid-cols-6 gap-1 rounded-md border border-border bg-background py-0.5">
                        {COLUMNAS_RESUMEN.map((col) => {
                          const v = Number(c[col.campo]);
                          return (
                            <div
                              key={col.estatus}
                              className={[
                                'text-center tabular-nums',
                                v === 0 ? 'text-muted-foreground/60' : '',
                              ].join(' ')}
                            >
                              {v}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-right tabular-nums">
                        {formatMoneda(c.costo_ine)}
                      </div>
                      <div
                        className={[
                          'text-right tabular-nums',
                          tonoDiferencia(c.diferencia),
                        ].join(' ')}
                      >
                        {c.captura_costo ? formatMoneda(c.diferencia) : '—'}
                      </div>
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
