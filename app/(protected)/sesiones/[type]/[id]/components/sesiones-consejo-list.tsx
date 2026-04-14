'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { AlertTriangle, Eye, Search, SearchX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { EstadoChips } from '@/app/(protected)/sesiones/components/estado-chips';
import type { TEstadoIndicador } from '@/types/sesiones';
import type { ISesionConsejo } from './sesiones-consejo-data';

// ─── Status API → TEstadoIndicador ──────────────────────────────────────────

const STATUS_TO_ESTADO: Record<string, TEstadoIndicador> = {
  PROGRAMADA: 'programada',
  DEMORA:     'con_demora',
  PROCESO:    'en_proceso',
  CONCLUIDA:  'concluida',
};

const ALL_ESTADOS: TEstadoIndicador[] = ['programada', 'con_demora', 'en_proceso', 'concluida'];

// ─── Status color → Badge variant mapping ───────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'info' | 'secondary';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  success:     'success',
  warning:     'warning',
  destructive: 'destructive',
  info:        'info',
};

function getStatusVariant(color: string): BadgeVariant {
  return STATUS_VARIANT[color] ?? 'secondary';
}

// ─── Formato de fecha ─────────────────────────────────────────────────────────

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const day    = String(d.getDate()).padStart(2, '0');
  const mes    = MESES[d.getMonth()];
  const year   = d.getFullYear();
  const hours  = d.getHours();
  const ampm   = hours >= 12 ? 'PM' : 'AM';
  const hh     = String(hours % 12 || 12).padStart(2, '0');
  const mm     = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mes} ${year} ${hh}:${mm} ${ampm}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface Props {
  type: string;
  idConsejo: string;
  sessions: ISesionConsejo[];
  isLoading: boolean;
  isError: boolean;
  notFound: boolean;
  onRetry: () => void;
}

export function SesionesConsejoList({
  type,
  idConsejo,
  sessions,
  isLoading,
  isError,
  notFound,
  onRetry,
}: Props) {
  const [search, setSearch] = useState('');
  const [estadosActivos, setEstadosActivos] = useState<Set<TEstadoIndicador>>(
    new Set(ALL_ESTADOS),
  );

  function toggleEstado(estado: TEstadoIndicador) {
    setEstadosActivos((prev) => {
      const next = new Set(prev);
      if (next.has(estado)) {
        if (next.size === 1) return prev; // al menos uno activo
        next.delete(estado);
      } else {
        next.add(estado);
      }
      return next;
    });
  }

  const conteos = useMemo<Record<TEstadoIndicador, number>>(() => {
    const c: Record<TEstadoIndicador, number> = { programada: 0, con_demora: 0, en_proceso: 0, concluida: 0 };
    sessions.forEach((s) => {
      const e = STATUS_TO_ESTADO[s.status];
      if (e) c[e]++;
    });
    return c;
  }, [sessions]);

  const filteredData = useMemo(() => {
    let result = sessions.filter((s) => {
      const e = STATUS_TO_ESTADO[s.status];
      return e ? estadosActivos.has(e) : true;
    });
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.noSesion.toLowerCase().includes(term) ||
          s.tipo.toLowerCase().includes(term) ||
          s.statusText.toLowerCase().includes(term),
      );
    }
    return result;
  }, [sessions, estadosActivos, search]);

  const columns = useMemo<ColumnDef<ISesionConsejo>[]>(
    () => [
      {
        id: 'status',
        header: 'Estatus',
        size: 130,
        cell: ({ row }) => (
          <Badge
            variant={getStatusVariant(row.original.statusColor)}
            size="sm"
            appearance="light"
          >
            {row.original.statusText}
          </Badge>
        ),
        meta: {
          skeleton: <Skeleton className="w-24 h-5 rounded animate-pulse motion-reduce:animate-none" />,
        },
      },
      {
        id: 'sesion',
        header: 'Sesión',
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {row.original.noSesion}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {row.original.tipo}
            </p>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              <Skeleton className="w-28 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-20 h-3 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
      },
      {
        accessorKey: 'fechaProgramada',
        header: 'Fecha Programada',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {formatFecha(row.original.fechaProgramada)}
          </span>
        ),
        meta: {
          skeleton: <Skeleton className="w-36 h-4 animate-pulse motion-reduce:animate-none" />,
        },
      },
      {
        accessorKey: 'fechaInicio',
        header: 'Fecha Inicio',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {formatFecha(row.original.fechaInicio)}
          </span>
        ),
        meta: {
          skeleton: <Skeleton className="w-36 h-4 animate-pulse motion-reduce:animate-none" />,
        },
      },
      {
        accessorKey: 'fechaTermino',
        header: 'Fecha Término',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {formatFecha(row.original.fechaTermino)}
          </span>
        ),
        meta: {
          skeleton: <Skeleton className="w-36 h-4 animate-pulse motion-reduce:animate-none" />,
        },
      },
      {
        accessorKey: 'incidencias',
        header: 'Incidencias',
        size: 100,
        cell: ({ row }) =>
          row.original.incidencias === 0 ? (
            <span className="block text-center text-gray-300 dark:text-gray-600 select-none">—</span>
          ) : (
            <div className="flex justify-center">
              <span className="inline-flex items-center justify-center min-w-[1.75rem] px-1.5 py-0.5 rounded bg-warning/10 text-warning text-sm font-semibold">
                {row.original.incidencias}
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
      },
      {
        id: 'actions',
        header: '',
        size: 64,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="outline" size="icon" asChild>
              <Link
                href={`/sesiones/${type}/${idConsejo}/session/${row.original.id}`}
                aria-label="Ver detalle de sesión"
              >
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [type, idConsejo],
  );

  const table = useReactTable({
    columns,
    data: filteredData,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  if (notFound) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-12 text-center space-y-3">
        <SearchX className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          No se encontró el consejo solicitado.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Verifica que el identificador sea correcto o regresa al listado.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-sm font-medium text-destructive">No se pudieron cargar las sesiones.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <DataGrid
      table={table}
      recordCount={filteredData.length}
      isLoading={isLoading}
      tableClassNames={{ edgeCell: 'px-5' }}
    >
      <Card>
        <CardHeader className="py-5">
          <div className="relative w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Buscar sesión..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              disabled={isLoading}
            />
          </div>
          <EstadoChips
            activos={estadosActivos}
            conteos={conteos}
            onToggle={toggleEstado}
            disabled={isLoading}
          />
        </CardHeader>
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination sizesLabel="Filas" sizesDescription="por página" info="{from} - {to} de {count}" />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
