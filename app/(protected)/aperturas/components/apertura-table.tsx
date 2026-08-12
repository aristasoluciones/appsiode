'use client';

import { useMemo } from 'react';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateOnly, formatTimeOnly } from '@/lib/helpers';
import type { IAperturaBodega, TTipoEleccion } from '@/types/aperturas-bodegas';

// ─── Cálculo de estatus a partir de `abierta` ────────────────────────────────
// El backend NO devuelve un campo `status` discreto; el soft-delete se filtra
// server-side con `deleted_at IS NULL`, por lo que el cliente solo ve aperturas
// no eliminadas. El estatus se deriva de:
//  - abierta=true  → 'Abierta'
//  - abierta=false → 'Cerrada'

type TEstatus = 'Abierta' | 'Cerrada';
type TVariant = 'success' | 'warning' | 'destructive' | 'info' | 'secondary';

function calcularEstatus(row: IAperturaBodega): TEstatus {
  return row.abierta ? 'Abierta' : 'Cerrada';
}

const ESTATUS_VARIANT: Record<TEstatus, TVariant> = {
  Abierta: 'success',
  Cerrada: 'secondary',
};

function estatusVariant(e: TEstatus): TVariant {
  return ESTATUS_VARIANT[e];
}

const ELECCION_LABEL: Record<TTipoEleccion, string> = {
  AYUN: 'Ayuntamientos',
  DIPU: 'Diputaciones',
  GOB: 'Gubernatura',
};

// ─── Tabla ────────────────────────────────────────────────────────────────────

interface AperturasTableProps {
  data: IAperturaBodega[];
  isLoading: boolean;
  emptyContent: React.ReactNode;
  headerContent: React.ReactNode;
}

export function AperturasTable({
  data,
  isLoading,
  emptyContent,
  headerContent,
}: AperturasTableProps) {
  const columns = useMemo<ColumnDef<IAperturaBodega>[]>(
    () => [
      {
        accessorKey: 'row',
        id: 'row',
        header: '#',
        size: 48,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground block text-center">
            {row.index + 1}
          </span>
        ),
        meta: {
          skeleton: (
            <Skeleton className="w-6 h-4 mx-auto animate-pulse motion-reduce:animate-none" />
          ),
        },
        enableSorting: false,
      },
      {
        id: 'estatus',
        header: 'Estatus',
        size: 110,
        accessorFn: (row) => calcularEstatus(row),
        cell: ({ row }) => {
          const e = calcularEstatus(row.original);
          return (
            <Badge
              variant={estatusVariant(e)}
              appearance="light"
              size="sm"
            >
              {e}
            </Badge>
          );
        },
        meta: {
          skeleton: (
            <Skeleton className="w-20 h-5 rounded animate-pulse motion-reduce:animate-none" />
          ),
        },
        enableSorting: true,
      },
      {
        id: 'apertura',
        header: 'Apertura',
        size: 200,
        accessorFn: (row) => `${row.fecha_apertura} ${row.hora_apertura}`,
        cell: ({ row }) => {
          const f = formatDateOnly(row.original.fecha_apertura);
          const h = formatTimeOnly(row.original.hora_apertura);
          return (
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">
                {f || '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{h || '—'}</p>
            </div>
          );
        },
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              <Skeleton className="w-28 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-16 h-3 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'cierre',
        header: 'Cierre',
        size: 200,
        accessorFn: (row) =>
          row.fecha_cierre ? `${row.fecha_cierre} ${row.hora_cierre}` : '',
        cell: ({ row }) => {
          if (!row.original.fecha_cierre) {
            return (
              <span className="text-sm text-muted-foreground">—</span>
            );
          }
          const f = formatDateOnly(row.original.fecha_cierre);
          const h = formatTimeOnly(row.original.hora_cierre ?? '');
          return (
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">
                {f}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{h}</p>
            </div>
          );
        },
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              <Skeleton className="w-28 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-16 h-3 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'consejeros',
        header: 'Consejeros',
        size: 100,
        accessorFn: (row) => row.consejeros ?? 0,
        cell: ({ row }) => (
          <div className="text-center">
            <span className="text-sm font-semibold text-foreground">
              {row.original.consejeros ?? 0}
            </span>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex justify-center">
              <Skeleton className="w-8 h-5 rounded animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'representantes',
        header: 'Representantes',
        size: 110,
        accessorFn: (row) => row.representantes ?? 0,
        cell: ({ row }) => (
          <div className="text-center">
            <span className="text-sm font-semibold text-foreground">
              {row.original.representantes ?? 0}
            </span>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex justify-center">
              <Skeleton className="w-8 h-5 rounded animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'motivo',
        header: 'Motivo',
        size: 280,
        accessorFn: (row) => row.motivo,
        cell: ({ row }) => (
          <div className="max-w-[260px]">
            <p
              className="text-sm text-foreground truncate"
              title={row.original.motivo}
            >
              {row.original.motivo || '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ELECCION_LABEL[row.original.bodega] ?? row.original.bodega}
            </p>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              <Skeleton className="w-44 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-24 h-3 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        size: 110,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Link href={`/aperturas/${row.original.id}?mode=read`}>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[40px] gap-1.5 text-primary hover:text-primary/80"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                <span>Ver</span>
              </Button>
            </Link>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <>
      <div className="md:hidden space-y-3">
        <Card>
          <CardHeader className="flex-wrap gap-3 py-4">{headerContent}</CardHeader>
        </Card>
        {isLoading ? (
          <MobileSkeletons />
        ) : data.length === 0 ? (
          emptyContent
        ) : (
          data.map((row) => <MobileCard key={row.id} row={row} />)
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
            <CardHeader className="flex-wrap gap-3 py-5">{headerContent}</CardHeader>
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

function MobileCard({ row }: { row: IAperturaBodega }) {
  const fA = formatDateOnly(row.fecha_apertura);
  const hA = formatTimeOnly(row.hora_apertura);
  const fC = row.fecha_cierre ? formatDateOnly(row.fecha_cierre) : null;
  const hC = row.hora_cierre ? formatTimeOnly(row.hora_cierre) : null;
  return (
    <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
      <header className="flex items-start justify-between gap-3">
        <div>
          {(() => {
            const e = calcularEstatus(row);
            return (
              <Badge
                variant={estatusVariant(e)}
                appearance="light"
                size="sm"
              >
                {e}
              </Badge>
            );
          })()}
          <p className="text-xs text-muted-foreground mt-1">
            {ELECCION_LABEL[row.bodega] ?? row.bodega}
          </p>
        </div>
        <Link href={`/aperturas/${row.id}?mode=read`}>
          <Button variant="outline" size="sm" className="min-h-[40px] gap-1.5">
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span>Ver</span>
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Apertura
          </p>
          <p className="font-medium text-foreground">{fA || '—'}</p>
          <p className="text-xs text-muted-foreground">{hA || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Cierre
          </p>
          <p className="font-medium text-foreground">{fC ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{hC ?? '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md bg-gray-50 dark:bg-gray-900/40 p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Consejeros</p>
          <p className="text-xl font-bold text-foreground">
            {row.consejeros ?? 0}
          </p>
        </div>
        <div className="rounded-md bg-gray-50 dark:bg-gray-900/40 p-2.5 text-center">
          <p className="text-xs text-muted-foreground">Representantes</p>
          <p className="text-xl font-bold text-foreground">
            {row.representantes ?? 0}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Motivo
        </p>
        <p
          className="text-sm text-foreground mt-0.5 line-clamp-2"
          title={row.motivo}
        >
          {row.motivo || '—'}
        </p>
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
          <div className="flex items-start justify-between">
            <Skeleton className="w-20 h-5 rounded animate-pulse motion-reduce:animate-none" />
            <Skeleton className="w-16 h-8 rounded animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-12 rounded animate-pulse motion-reduce:animate-none" />
          </div>
          <Skeleton className="h-4 w-3/4 animate-pulse motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}
