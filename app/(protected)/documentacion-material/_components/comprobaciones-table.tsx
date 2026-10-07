'use client';

import { useEffect, useMemo } from 'react';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { History, SquarePen } from 'lucide-react';
import type { IComprobacionDocumento } from '@/types/material-electoral';
import { formatFechaHora } from '@/lib/fechas';
import { formatNumero } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArticuloFoto } from './articulo-foto';
import { diferenciaConSigno, enPaquetesCajas } from './comprobacion-cantidades';
import { ESTATUS_COMPROBACION } from './comprobacion-estatus';

/** Diferencia con signo y color; `null` mientras el renglón no se captura. */
function Diferencia({ valor }: { valor: number | null }) {
  if (valor == null) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  const color =
    valor === 0
      ? 'text-muted-foreground'
      : valor < 0
        ? 'text-destructive'
        : 'text-warning';
  return (
    <span className={`text-sm font-semibold ${color}`}>
      {diferenciaConSigno(valor)}
    </span>
  );
}

interface ComprobacionesTableProps {
  data: IComprobacionDocumento[];
  isLoading: boolean;
  emptyContent: React.ReactNode;
  headerContent: React.ReactNode;
  /** Abre la captura del renglón; ausente = sin permiso para registrar. */
  onCapturar?: (documento: IComprobacionDocumento) => void;
  /** Abre el historial del renglón; ausente = sin permiso para el detalle. */
  onHistorial?: (documento: IComprobacionDocumento) => void;
  /** Cambia con los filtros en pantalla; al cambiar, el listado vuelve a la primera página. */
  filtrosClave?: string;
  /** Renglón recién guardado: se lleva a su página, se desplaza la vista y se resalta. */
  resaltadoId?: number | null;
}

/** Desplaza la vista hasta el renglón (fila de la tabla o tarjeta móvil visible). */
function desplazarHasta(id: number) {
  const reducido = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  document
    .querySelectorAll<HTMLElement>(`[data-comprobacion="${id}"]`)
    .forEach((el) => {
      // Solo hay uno visible: la tabla en escritorio o la tarjeta en celular.
      if (el.getClientRects().length === 0) return;
      (el.closest('tr') ?? el).scrollIntoView({
        block: 'center',
        behavior: reducido ? 'auto' : 'smooth',
      });
    });
}

export function ComprobacionesTable({
  data,
  isLoading,
  emptyContent,
  headerContent,
  onCapturar,
  onHistorial,
  filtrosClave,
  resaltadoId = null,
}: ComprobacionesTableProps) {
  const columns = useMemo<ColumnDef<IComprobacionDocumento>[]>(
    () => [
      {
        id: 'documento',
        header: 'Documento o material',
        size: 420,
        accessorFn: (row) => `${row.codigo} ${row.desc_documento}`,
        cell: ({ row }) => (
          <div
            className="flex w-full items-start gap-3"
            data-comprobacion={row.original.id}
          >
            {/* Solo hay miniatura cuando el artículo tiene fotografía; sin ella
                no se reserva espacio. */}
            <ArticuloFoto
              codigo={row.original.codigo}
              descripcion={row.original.desc_documento}
              miniatura={row.original.miniatura_url}
              imagen={row.original.imagen_url}
            />
            <div className="min-w-0">
              {/* El nombre va completo: se envuelve en varias líneas en lugar de
                  cortarse, porque es lo que identifica el registro. */}
              <p className="text-sm font-medium text-foreground whitespace-normal break-words text-pretty">
                {row.original.desc_documento || '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-mono font-semibold text-foreground/80">
                  {row.original.codigo}
                </span>
                {row.original.version ? ` · v${row.original.version}` : ''}
                {row.original.desc_tipo ? ` · ${row.original.desc_tipo}` : ''}
              </p>
            </div>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-md animate-pulse motion-reduce:animate-none" />
              <div className="space-y-1.5">
                <Skeleton className="w-52 h-4 animate-pulse motion-reduce:animate-none" />
                <Skeleton className="w-32 h-3 animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'eleccion',
        header: 'Elección',
        size: 150,
        accessorFn: (row) => row.desc_eleccion || row.id_eleccion,
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.desc_eleccion || row.original.id_eleccion}
          </span>
        ),
        meta: {
          skeleton: (
            <Skeleton className="w-24 h-4 animate-pulse motion-reduce:animate-none" />
          ),
        },
        enableSorting: true,
      },
      {
        id: 'cantidad',
        header: 'Entregada',
        size: 130,
        accessorFn: (row) => row.cantidad ?? 0,
        cell: ({ row }) => {
          const paquetes = enPaquetesCajas(row.original.numero_paquetes_cajas);
          return (
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground">
                {formatNumero(row.original.cantidad ?? 0)}
              </span>
              {paquetes && (
                <p className="text-xs text-muted-foreground leading-tight whitespace-nowrap">
                  {paquetes}
                </p>
              )}
            </div>
          );
        },
        meta: {
          skeleton: (
            <div className="flex flex-col items-end gap-1.5">
              <Skeleton className="w-10 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-20 h-3 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'cantidad_fisica',
        header: 'Física',
        size: 92,
        accessorFn: (row) => row.cantidad_fisica ?? -1,
        cell: ({ row }) => (
          <div className="text-right">
            {row.original.cantidad_fisica == null ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {formatNumero(row.original.cantidad_fisica)}
              </span>
            )}
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex justify-end">
              <Skeleton className="w-10 h-4 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'diferencia',
        header: 'Diferencia',
        size: 110,
        accessorFn: (row) => row.diferencia ?? 0,
        cell: ({ row }) => (
          <div className="text-right">
            <Diferencia valor={row.original.diferencia} />
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex justify-end">
              <Skeleton className="w-10 h-4 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'captura',
        header: 'Última captura',
        size: 200,
        accessorFn: (row) => row.fecha_registro ?? '',
        cell: ({ row }) => {
          if (!row.original.fecha_registro) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <div className="max-w-[180px]">
              <p className="text-sm text-foreground leading-tight">
                {formatFechaHora(row.original.fecha_registro)}
              </p>
              {row.original.observaciones &&
                row.original.observaciones !== '-' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* tabIndex para que el tooltip también se abra con teclado. */}
                      <p
                        tabIndex={0}
                        className="text-xs text-muted-foreground mt-0.5 truncate cursor-help focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 rounded-sm"
                      >
                        {row.original.observaciones}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs whitespace-pre-line text-left"
                    >
                      {row.original.observaciones}
                    </TooltipContent>
                  </Tooltip>
                )}
            </div>
          );
        },
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              <Skeleton className="w-32 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-24 h-3 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'estatus',
        header: 'Estatus',
        size: 170,
        accessorFn: (row) => ESTATUS_COMPROBACION[row.estatus]?.label ?? '',
        cell: ({ row }) => {
          const estatus = ESTATUS_COMPROBACION[row.original.estatus];
          if (!estatus) return null;
          return (
            <Badge
              variant={estatus.variant}
              appearance="light"
              size="md"
              className="px-2.5"
            >
              {estatus.label}
            </Badge>
          );
        },
        meta: {
          skeleton: (
            <Skeleton className="w-28 h-5 rounded animate-pulse motion-reduce:animate-none" />
          ),
        },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        size: 110,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {onCapturar && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-primary"
                    aria-label="Capturar cantidad física"
                    onClick={() => onCapturar(row.original)}
                  >
                    <SquarePen className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {row.original.cantidad_fisica == null
                    ? 'Capturar cantidad física'
                    : 'Corregir cantidad física'}
                </TooltipContent>
              </Tooltip>
            )}
            {onHistorial && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Ver historial de comprobaciones"
                    onClick={() => onHistorial(row.original)}
                  >
                    <History className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver historial</TooltipContent>
              </Tooltip>
            )}
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onCapturar, onHistorial],
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row.id),
    initialState: { pagination: { pageSize: 20 } },
    // Al guardar una captura se recargan los datos; sin esto la tabla regresaría
    // a la primera página. Los reinicios se controlan abajo.
    autoResetPageIndex: false,
    // La selección solo se usa para resaltar el renglón recién guardado.
    enableRowSelection: () => false,
    state: {
      rowSelection: resaltadoId != null ? { [String(resaltadoId)]: true } : {},
    },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const sorting = table.getState().sorting;

  // Cambiar filtros u orden sí regresa a la primera página.
  useEffect(() => {
    table.setPageIndex(0);
  }, [filtrosClave, sorting, table]);

  // Si el listado se acorta (p. ej. el renglón salió del filtro de estatus),
  // la página no debe quedar fuera de rango.
  useEffect(() => {
    if (pageIndex > 0 && pageIndex >= pageCount) {
      table.setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [pageIndex, pageCount, table]);

  // Lleva a la página del renglón guardado; con un orden activo pudo moverse.
  useEffect(() => {
    if (resaltadoId == null) return;
    const indice = table
      .getPrePaginationRowModel()
      .rows.findIndex((r) => r.original.id === resaltadoId);
    if (indice >= 0) table.setPageIndex(Math.floor(indice / pageSize));
  }, [resaltadoId, data, pageSize, table]);

  // Corre después de pintar la página correcta.
  useEffect(() => {
    if (resaltadoId != null) desplazarHasta(resaltadoId);
  }, [resaltadoId, pageIndex]);

  return (
    <>
      <div className="md:hidden space-y-3">
        <Card>
          <CardHeader className="flex-wrap gap-3 py-4">
            {headerContent}
          </CardHeader>
        </Card>
        {isLoading ? (
          <MobileSkeletons />
        ) : data.length === 0 ? (
          emptyContent
        ) : (
          data.map((row) => (
            <MobileCard
              key={row.id}
              row={row}
              resaltado={row.id === resaltadoId}
              onCapturar={onCapturar}
              onHistorial={onHistorial}
            />
          ))
        )}
      </div>

      <div className="hidden md:block">
        <DataGrid
          table={table}
          recordCount={data.length}
          isLoading={isLoading}
          emptyMessage={emptyContent}
          tableClassNames={{
            edgeCell: 'px-5',
            bodyRow:
              'transition-colors duration-700 motion-reduce:transition-none data-[state=selected]:bg-primary/10',
          }}
        >
          <Card>
            <CardHeader className="flex-wrap gap-3 py-5">
              {headerContent}
            </CardHeader>
            <CardTable>
              <ScrollArea>
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
            <CardFooter>
              <DataGridPagination
                sizesLabel="Mostrar"
                sizesDescription="por página"
                info="{from} - {to} de {count}"
              />
            </CardFooter>
          </Card>
        </DataGrid>
      </div>
    </>
  );
}

// ─── Tarjeta móvil ────────────────────────────────────────────────────────────

function MobileCard({
  row,
  resaltado,
  onCapturar,
  onHistorial,
}: {
  row: IComprobacionDocumento;
  resaltado: boolean;
  onCapturar?: (documento: IComprobacionDocumento) => void;
  onHistorial?: (documento: IComprobacionDocumento) => void;
}) {
  const estatus = ESTATUS_COMPROBACION[row.estatus];
  return (
    <article
      data-comprobacion={row.id}
      className={`border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800 transition-colors duration-700 motion-reduce:transition-none ${
        resaltado
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <header className="space-y-1">
        {estatus && (
          <Badge
            variant={estatus.variant}
            appearance="light"
            size="md"
            className="px-2.5"
          >
            {estatus.label}
          </Badge>
        )}
        <div className="flex items-start gap-3">
          <ArticuloFoto
            codigo={row.codigo}
            descripcion={row.desc_documento}
            miniatura={row.miniatura_url}
            imagen={row.imagen_url}
            tamano="md"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {row.desc_documento || '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-mono font-semibold text-foreground/80">
                {row.codigo}
              </span>
              {' · '}
              {row.desc_eleccion || row.id_eleccion}
              {row.version ? ` · v${row.version}` : ''}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-gray-50 dark:bg-gray-900/40 p-2.5">
          <p className="text-xs text-muted-foreground">Entregada</p>
          <p className="text-lg font-bold text-foreground">
            {formatNumero(row.cantidad ?? 0)}
          </p>
          {enPaquetesCajas(row.numero_paquetes_cajas) && (
            <p className="text-[11px] text-muted-foreground leading-tight">
              {enPaquetesCajas(row.numero_paquetes_cajas)}
            </p>
          )}
        </div>
        <div className="rounded-md bg-gray-50 dark:bg-gray-900/40 p-2.5">
          <p className="text-xs text-muted-foreground">Física</p>
          <p className="text-lg font-bold text-foreground">
            {formatNumero(row.cantidad_fisica)}
          </p>
        </div>
        <div className="rounded-md bg-gray-50 dark:bg-gray-900/40 p-2.5">
          <p className="text-xs text-muted-foreground">Diferencia</p>
          <p className="text-lg font-bold">
            <Diferencia valor={row.diferencia} />
          </p>
        </div>
      </div>

      {row.observaciones && row.observaciones !== '-' && (
        <p className="text-sm text-foreground line-clamp-2">
          {row.observaciones}
        </p>
      )}

      <div className="flex items-center gap-2">
        {onCapturar && (
          <Button
            variant="outline"
            size="sm"
            className="min-h-[40px] gap-1.5 flex-1"
            onClick={() => onCapturar(row)}
          >
            <SquarePen className="h-4 w-4" aria-hidden="true" />
            <span>{row.cantidad_fisica == null ? 'Capturar' : 'Corregir'}</span>
          </Button>
        )}
        {onHistorial && (
          <Button
            variant="outline"
            size="sm"
            className="min-h-[40px] gap-1.5"
            onClick={() => onHistorial(row)}
          >
            <History className="h-4 w-4" aria-hidden="true" />
            <span>Historial</span>
          </Button>
        )}
      </div>
    </article>
  );
}

function MobileSkeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 space-y-3"
        >
          <Skeleton className="w-28 h-5 rounded animate-pulse motion-reduce:animate-none" />
          <Skeleton className="w-3/4 h-4 animate-pulse motion-reduce:animate-none" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-12 rounded animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-12 rounded animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-12 rounded animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
