'use client';

import { useMemo } from 'react';
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
      {valor > 0 ? `+${valor}` : valor}
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
}

export function ComprobacionesTable({
  data,
  isLoading,
  emptyContent,
  headerContent,
  onCapturar,
  onHistorial,
}: ComprobacionesTableProps) {
  const columns = useMemo<ColumnDef<IComprobacionDocumento>[]>(
    () => [
      {
        id: 'documento',
        header: 'Documento o material',
        size: 420,
        accessorFn: (row) => `${row.desc_documento} ${row.id_documento}`,
        cell: ({ row }) => (
          <div className="w-full">
            {/* El nombre va completo: se envuelve en varias líneas en lugar de
                cortarse, porque es lo que identifica el registro. */}
            <p className="text-sm font-medium text-foreground whitespace-normal break-words text-pretty">
              {row.original.desc_documento || '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {row.original.id_documento}
              {row.original.version ? ` · v${row.original.version}` : ''}
              {row.original.desc_tipo ? ` · ${row.original.desc_tipo}` : ''}
            </p>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              <Skeleton className="w-52 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-32 h-3 animate-pulse motion-reduce:animate-none" />
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
        size: 92,
        accessorFn: (row) => row.cantidad ?? 0,
        cell: ({ row }) => (
          <div className="text-right">
            <span className="text-sm font-semibold text-foreground">
              {row.original.cantidad ?? 0}
            </span>
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
                {row.original.cantidad_fisica}
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
                  <p
                    className="text-xs text-muted-foreground mt-0.5 truncate"
                    title={row.original.observaciones}
                  >
                    {row.original.observaciones}
                  </p>
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
        size: 128,
        accessorFn: (row) => ESTATUS_COMPROBACION[row.estatus]?.label ?? '',
        cell: ({ row }) => {
          const estatus = ESTATUS_COMPROBACION[row.original.estatus];
          if (!estatus) return null;
          return (
            <Badge variant={estatus.variant} appearance="light" size="sm">
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
            {onHistorial && row.original.capturas > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Ver historial de capturas"
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
  });

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
          tableClassNames={{ edgeCell: 'px-5' }}
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
  onCapturar,
  onHistorial,
}: {
  row: IComprobacionDocumento;
  onCapturar?: (documento: IComprobacionDocumento) => void;
  onHistorial?: (documento: IComprobacionDocumento) => void;
}) {
  const estatus = ESTATUS_COMPROBACION[row.estatus];
  return (
    <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
      <header className="space-y-1">
        {estatus && (
          <Badge variant={estatus.variant} appearance="light" size="sm">
            {estatus.label}
          </Badge>
        )}
        <p className="text-sm font-medium text-foreground">
          {row.desc_documento || '—'}
        </p>
        <p className="text-xs text-muted-foreground">
          {row.desc_eleccion || row.id_eleccion} · {row.id_documento}
          {row.version ? ` · v${row.version}` : ''}
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-gray-50 dark:bg-gray-900/40 p-2.5">
          <p className="text-xs text-muted-foreground">Entregada</p>
          <p className="text-lg font-bold text-foreground">
            {row.cantidad ?? 0}
          </p>
        </div>
        <div className="rounded-md bg-gray-50 dark:bg-gray-900/40 p-2.5">
          <p className="text-xs text-muted-foreground">Física</p>
          <p className="text-lg font-bold text-foreground">
            {row.cantidad_fisica ?? '—'}
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
        {onHistorial && row.capturas > 0 && (
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
