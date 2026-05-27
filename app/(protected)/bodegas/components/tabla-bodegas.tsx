'use client';

import { useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  AlertTriangle,
  Eye,
  FileSpreadsheet,
  Folder,
  Loader2,
  Pencil,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/providers/auth-provider';
import apiClient from '@/lib/api/axios-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import type { IBodegaResumen, TStatusBodega } from '@/types/bodegas';

// ─── Configuración de estados ─────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TStatusBodega,
  { label: string; colorText: string; colorBg: string; colorBorder: string }
> = {
  Registrada: {
    label: 'Registrada',
    colorText: 'text-gray-600 dark:text-gray-400',
    colorBg: 'bg-gray-100 dark:bg-gray-800',
    colorBorder: 'border-gray-300 dark:border-gray-600',
  },
  Verificada: {
    label: 'Verificada',
    colorText: 'text-yellow-700 dark:text-yellow-400',
    colorBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    colorBorder: 'border-yellow-400',
  },
  Comprobada: {
    label: 'Comprobada',
    colorText: 'text-green-700 dark:text-green-400',
    colorBg: 'bg-green-50 dark:bg-green-900/20',
    colorBorder: 'border-green-400',
  },
  Informada: {
    label: 'Informada',
    colorText: 'text-violet-700 dark:text-violet-400',
    colorBg: 'bg-violet-50 dark:bg-violet-900/20',
    colorBorder: 'border-violet-400',
  },
};

const STATUS_OPTIONS: { value: TStatusBodega | '__all__'; label: string }[] = [
  { value: '__all__', label: 'Todos los estados' },
  { value: 'Registrada', label: 'Registrada' },
  { value: 'Verificada', label: 'Verificada' },
  { value: 'Comprobada', label: 'Comprobada' },
  { value: 'Informada', label: 'Informada' },
];

// ─── Badge de status ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TStatusBodega }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.colorBg} ${cfg.colorText} ${cfg.colorBorder}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Tarjeta móvil ────────────────────────────────────────────────────────────

function MobileCard({ row, canEditar }: { row: IBodegaResumen; canEditar: boolean }) {
  return (
    <article className="border border-border rounded-lg p-4 space-y-3 bg-card">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-muted-foreground">#{row.id_consejo}</p>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
            {row.nombre_consejo}
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {row.tipo_consejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal'}
          </p>
        </div>
        <StatusBadge status={row.status} />
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.8125rem]">
        <div>
          <span className="text-muted-foreground">Superficie: </span>
          <span className="font-medium text-foreground">
            {row.superficie_m2 != null ? `${row.superficie_m2} m²` : '—'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Paquetes est.: </span>
          <span className="font-medium text-foreground">
            {row.num_paquetes_estimados ?? '—'}
          </span>
        </div>
      </div>

      <footer className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <Link href={`/bodegas/${row.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-primary hover:text-primary/80"
            aria-label={`Ver bodega ${row.id}`}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span>Ver</span>
          </Button>
        </Link>
        {canEditar && (
          <Link href={`/bodegas/${row.id}/editar`}>
            <Button variant="outline" size="icon" aria-label={`Editar bodega ${row.id}`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        )}
      </footer>
    </article>
  );
}

// ─── Skeletons móvil ──────────────────────────────────────────────────────────

function MobileSkeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5">
              <Skeleton className="w-20 h-3 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-44 h-4 animate-pulse motion-reduce:animate-none" />
            </div>
            <Skeleton className="w-20 h-5 rounded-md animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-4 w-full animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="flex justify-end pt-2 border-t border-border">
            <Skeleton className="h-8 w-16 rounded-md animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
// ─── Props ────────────────────────────────────────────────────────────────────

interface TablaBodegasProps {
  data: IBodegaResumen[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  tipoConsejo: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function TablaBodegas({
  data,
  isLoading,
  isError,
  onRetry,
  tipoConsejo,
}: TablaBodegasProps) {
  const { hasPermission } = useAuth();
  const canEditar = hasPermission('bodegas.editar');

  const [busqueda, setBusqueda] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<TStatusBodega | '__all__'>('__all__');
  const [isExporting, setIsExporting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const dataFiltrada = useMemo(() => {
    return data.filter((b) => {
      const matchBusqueda =
        !busqueda ||
        b.organo_competente.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(b.id_consejo).includes(busqueda);
      const matchStatus = statusFiltro === '__all__' || b.status === statusFiltro;
      return matchBusqueda && matchStatus;
    });
  }, [data, busqueda, statusFiltro]);

  async function handleExportar() {
    setIsExporting(true);
    try {
      const { data: blob, headers } = await apiClient.get(
        API_ENDPOINTS.BODEGAS.EXPORTAR(tipoConsejo),
        { responseType: 'blob' },
      );
      const cd = headers['content-disposition'] as string | undefined;
      const match = cd?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const filename = match ? match[1].replace(/['"]/g, '') : 'bodegas.xlsx';
      const url = window.URL.createObjectURL(new Blob([blob as BlobPart]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Archivo descargado correctamente.');
    } catch {
      toast.error('No se pudo exportar. Intenta nuevamente.');
    } finally {
      setIsExporting(false);
    }
  }

  const columns = useMemo<ColumnDef<IBodegaResumen>[]>(
    () => [
      {
        accessorKey: 'id_consejo',
        header: 'Clave',
        size: 72,
        cell: ({ row }) => (
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 block text-center">
            {row.original.id_consejo}
          </span>
        ),
        meta: {
          skeleton: (
            <Skeleton className="h-4 w-10 animate-pulse motion-reduce:animate-none" />
          ),
        },
        enableSorting: true,
      },
      {
        accessorKey: 'nombre_consejo',
        header: 'Consejo',
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {row.original.nombre_consejo}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {row.original.tipo_consejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal'} { ' '}
              {row.original.id_consejo}
            </p>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              <Skeleton className="w-44 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-28 h-3 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        accessorKey: 'organo_competente',
        header: 'Órgano Competente',
        cell: ({ row }) => (
          <p className="text-sm text-foreground">
            {row.original.organo_competente}
          </p>
        ),
        meta: {
          skeleton: (
            <Skeleton className="h-4 w-44 animate-pulse motion-reduce:animate-none" />
          ),
        },
        enableSorting: true,
      },
      {
        accessorKey: 'superficie_m2',
        header: 'Superficie',
        size: 100,
        cell: ({ row }) => (
          <span className="text-[0.8125rem] text-muted-foreground">
            {row.original.superficie_m2 != null ? `${row.original.superficie_m2} m²` : '—'}
          </span>
        ),
        meta: {
          skeleton: (
            <Skeleton className="h-4 w-14 animate-pulse motion-reduce:animate-none" />
          ),
        },
      },
      {
        accessorKey: 'num_paquetes_estimados',
        header: 'Paquetes Est.',
        size: 110,
        cell: ({ row }) => (
          <span className="text-[0.8125rem] text-muted-foreground">
            {row.original.num_paquetes_estimados ?? '—'}
          </span>
        ),
        meta: {
          skeleton: (
            <Skeleton className="h-4 w-10 animate-pulse motion-reduce:animate-none" />
          ),
        },
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 120,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        meta: {
          skeleton: (
            <Skeleton className="h-5 w-24 rounded-md animate-pulse motion-reduce:animate-none" />
          ),
        },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        size: canEditar ? 110 : 80,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/bodegas/${row.original.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary hover:text-primary/80"
                aria-label={`Ver bodega ${row.original.id}`}
              >
                <span>Ver</span>
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            {canEditar && (
              <Link href={`/bodegas/${row.original.id}/editar`}>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Editar bodega ${row.original.id}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            )}
          </div>
        ),
      },
    ],
    [canEditar],
  );

  const table = useReactTable({
    columns,
    data: dataFiltrada,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  // ── Error ───────────────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center px-4 border border-destructive/30 rounded-lg bg-destructive/5"
        role="alert"
      >
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" aria-hidden="true" />
        <h3 className="text-base font-semibold mb-1">No se pudo cargar la información</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ocurrió un error al obtener las bodegas. Intenta nuevamente.
        </p>
        <Button onClick={onRetry} variant="outline" className="min-h-[44px]">
          Reintentar
        </Button>
      </div>
    );
  }

  // ── Empty states ────────────────────────────────────────────────────────────

  const emptyContent =
    busqueda.trim() || statusFiltro !== '__all__' ? (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div
          className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3"
          aria-hidden="true"
        >
          <Search className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground mb-3">
          Sin resultados para los filtros aplicados
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setBusqueda('');
            setStatusFiltro('__all__');
          }}
          className="text-primary"
        >
          Limpiar filtros
        </Button>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div
          className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"
          aria-hidden="true"
        >
          <Folder className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">Sin bodegas registradas</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          No hay bodegas para el tipo de consejo seleccionado.
        </p>
      </div>
    );

  // ── Header con controles ────────────────────────────────────────────────────

  const headerContent = (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          ref={searchRef}
          type="search"
          placeholder="Buscar consejo u órgano…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          disabled={isLoading}
          aria-label="Buscar bodegas"
          className="pl-9 pr-8 w-full sm:w-56"
        />
        {busqueda && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setBusqueda('');
              searchRef.current?.focus();
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <Select
        value={statusFiltro}
        onValueChange={(v) => setStatusFiltro(v as TStatusBodega | '__all__')}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full sm:w-44 h-9" aria-label="Filtrar por estado">
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportar}
          disabled={isLoading || isExporting}
          className="gap-1.5"
          aria-label="Exportar a Excel"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          )}
          <span>Exportar</span>
        </Button>
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Móvil (< md) */}
      <div className="md:hidden space-y-3">
        <Card>
          <CardHeader className="flex-wrap gap-3 py-4">{headerContent}</CardHeader>
        </Card>
        {isLoading ? (
          <MobileSkeletons />
        ) : dataFiltrada.length === 0 ? (
          emptyContent
        ) : (
          dataFiltrada.map((row) => (
            <MobileCard key={row.id} row={row} canEditar={canEditar} />
          ))
        )}
      </div>

      {/* Escritorio (md+) */}
      <div className="hidden md:block">
        <DataGrid
          table={table}
          recordCount={dataFiltrada.length}
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
