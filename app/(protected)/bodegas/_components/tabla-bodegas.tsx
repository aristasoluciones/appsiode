'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
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
  ClipboardCheck,
  Eye,
  FileSpreadsheet,
  Folder,
  Loader2,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { descargarXLSX } from '@/lib/export-xlsx';
import { useEliminarBodega } from '../_hooks/use-bodegas';
import type { IBodegaResumen, TStatusBodega } from '@/types/bodegas';

const STATUS_CONFIG: Record<
  TStatusBodega,
  { label: string; colorText: string; colorBg: string; colorBorder: string }
> = {
  'En captura': {
    label: 'En captura',
    colorText: 'text-blue-700 dark:text-blue-400',
    colorBg: 'bg-blue-50 dark:bg-blue-900/20',
    colorBorder: 'border-blue-300 dark:border-blue-700',
  },
  Capturada: {
    label: 'Capturada',
    colorText: 'text-gray-600 dark:text-gray-400',
    colorBg: 'bg-gray-100 dark:bg-gray-800',
    colorBorder: 'border-gray-300 dark:border-gray-600',
  },
  Observada: {
    label: 'Observada',
    colorText: 'text-rose-700 dark:text-rose-400',
    colorBg: 'bg-rose-50 dark:bg-rose-900/20',
    colorBorder: 'border-rose-400',
  },
  Determinada: {
    label: 'Determinada',
    colorText: 'text-emerald-700 dark:text-emerald-400',
    colorBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    colorBorder: 'border-emerald-400',
  },
  Verificada: {
    label: 'Verificada',
    colorText: 'text-yellow-700 dark:text-yellow-400',
    colorBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    colorBorder: 'border-yellow-400',
  },
  Aceptada: {
    label: 'Aceptada',
    colorText: 'text-green-700 dark:text-green-400',
    colorBg: 'bg-green-50 dark:bg-green-900/20',
    colorBorder: 'border-green-400',
  },
  Rechazada: {
    label: 'Rechazada',
    colorText: 'text-red-700 dark:text-red-400',
    colorBg: 'bg-red-50 dark:bg-red-900/20',
    colorBorder: 'border-red-400',
  },
};

const STATUS_OPTIONS: { value: TStatusBodega | '__all__'; label: string }[] = [
  { value: '__all__', label: 'Todos los estados' },
  { value: 'En captura', label: 'En captura' },
  { value: 'Capturada', label: 'Capturada' },
  { value: 'Observada', label: 'Observada' },
  { value: 'Determinada', label: 'Determinada' },
  { value: 'Verificada', label: 'Verificada' },
  { value: 'Aceptada', label: 'Aceptada' },
  { value: 'Rechazada', label: 'Rechazada' },
];

const STATUS_FALLBACK: Record<string, keyof typeof STATUS_CONFIG> = {
  Validada: 'Determinada',
  Registrada: 'Capturada',
};

function StatusBadge({ status }: { status: TStatusBodega }) {
  const key = STATUS_CONFIG[status] ? status : (STATUS_FALLBACK[status] ?? status);
  const cfg = STATUS_CONFIG[key];
  if (!cfg) return <span className="text-xs text-muted-foreground">{status}</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.colorBg} ${cfg.colorText} ${cfg.colorBorder}`}>
      {cfg.label}
    </span>
  );
}

function MobileCard({ row, canEditar, canEliminar, canVerificaciones, isOwnConsejo, onEliminar }: {
  row: IBodegaResumen;
  canEditar: boolean;
  canEliminar: boolean;
  canVerificaciones: boolean;
  isOwnConsejo: boolean;
  onEliminar: (row: IBodegaResumen) => void;
}) {
  const esTerminal = ['Determinada', 'Verificada', 'Aceptada', 'Rechazada'].includes(row.status);
  const puedeVerificar = esTerminal && canVerificaciones;
  const puedeEditar = canEditar && !esTerminal && isOwnConsejo;
  // La bodega puede eliminarse únicamente hasta el estatus "Determinada".
  const esPostDeterminada = ['Verificada', 'Aceptada', 'Rechazada'].includes(row.status);
  const puedeEliminar = canEliminar && !esPostDeterminada && isOwnConsejo;
  const statusCfg = STATUS_CONFIG[row.status];
  return (
    <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {row.tipo === 'Consejo' && row.id_consejo != null
              ? `#${row.id_consejo} · ${row.organo_competente}`
              : row.tipo}
          </p>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{row.nombre_consejo ?? row.tipo}</h3>
          {row.tipo === 'Consejo' && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{row.tipo_consejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal'}</p>
          )}
        </div>
        <StatusBadge status={row.status} />
      </header>
      <div className="grid grid-cols-2 gap-2" role="list" aria-label="Características">
        <div role="listitem" className="flex flex-col items-center justify-center rounded-md p-2.5 bg-gray-50 dark:bg-gray-700/50">
          <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{row.superficie_m2 != null ? `${row.superficie_m2} m²` : '—'}</span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Superficie</span>
        </div>
        <div role="listitem" className="flex flex-col items-center justify-center rounded-md p-2.5 bg-gray-50 dark:bg-gray-700/50">
          <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{row.num_paquetes_estimados != null ? row.num_paquetes_estimados : '—'}</span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Paquetes est.</span>
        </div>
      </div>
      <footer className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {statusCfg && (
            <>
              <span className={`inline-block w-2 h-2 rounded-full ${statusCfg.colorBg}`} aria-hidden="true" />
              <span className={`text-xs font-medium ${statusCfg.colorText}`}>{statusCfg.label}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/bodegas/${row.id}`}>
                <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80" aria-label={`Ver bodega ${row.id}`}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">Ver bodega</TooltipContent>
          </Tooltip>
          {puedeVerificar && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/bodegas/${row.id}/verificaciones`}>
                  <Button variant="ghost" size="icon" className="text-emerald-600 hover:text-emerald-700" aria-label={`Verificaciones bodega ${row.id}`}>
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">Verificaciones</TooltipContent>
            </Tooltip>
          )}
          {puedeEditar && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/bodegas/${row.id}/editar`}>
                  <Button variant="outline" size="icon" aria-label={`Editar bodega ${row.id}`}><Pencil className="h-4 w-4" aria-hidden="true" /></Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">Editar bodega</TooltipContent>
            </Tooltip>
          )}
          {puedeEliminar && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Eliminar bodega ${row.id}`}
                  onClick={() => onEliminar(row)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Eliminar bodega</TooltipContent>
            </Tooltip>
          )}
        </div>
      </footer>
    </article>
  );
}

function MobileSkeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5"><Skeleton className="w-20 h-3 animate-pulse motion-reduce:animate-none" /><Skeleton className="w-44 h-4 animate-pulse motion-reduce:animate-none" /></div>
            <Skeleton className="w-20 h-5 rounded-md animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="grid grid-cols-2 gap-2"><Skeleton className="h-16 rounded-md animate-pulse motion-reduce:animate-none" /><Skeleton className="h-16 rounded-md animate-pulse motion-reduce:animate-none" /></div>
          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700"><Skeleton className="h-8 w-16 rounded-md animate-pulse motion-reduce:animate-none" /></div>
        </div>
      ))}
    </div>
  );
}

interface TablaBodegasProps {
  data: IBodegaResumen[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  tipo: 'OC' | 'C';
  tipoConsejo?: string;
  activeFilters?: TStatusBodega[];
}

export function TablaBodegas({ data, isLoading, isError, onRetry, tipo, tipoConsejo, activeFilters }: TablaBodegasProps) {
  const { user, hasPermission } = useAuth();
  const canEditar = hasPermission('bodegas.be.actualizar');
  const canEliminar = hasPermission('bodegas.be.eliminar');
  const canVerificaciones = hasPermission('bodegas.be.verificaciones');

  // Usuario con consejo asignado (idConsejo > 0) solo puede editar/eliminar en su consejo
  const isCapturista = parseInt(user?.idConsejo ?? '0') > 0;

  const { mutate: eliminarBodega, isPending: eliminando } = useEliminarBodega();
  const [bodegaAEliminar, setBodegaAEliminar] = useState<IBodegaResumen | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<TStatusBodega | '__all__'>('__all__');
  const [isExporting, setIsExporting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync external activeFilters (from dashboard stats) — sets dropdown to __all__
  useEffect(() => {
    if (activeFilters) setStatusFiltro('__all__');
  }, [activeFilters]);

  const dataFiltrada = useMemo(() => {
    return data.filter((b) => {
      const matchBusqueda =
        !busqueda ||
        b.organo_competente.toLowerCase().includes(busqueda.toLowerCase()) ||
        (b.nombre_consejo ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (b.id_consejo != null ? String(b.id_consejo).includes(busqueda) : false);
      const matchStatus = activeFilters
        ? activeFilters.includes(b.status)
        : statusFiltro === '__all__' || b.status === statusFiltro;
      return matchBusqueda && matchStatus;
    });
  }, [data, busqueda, statusFiltro, activeFilters]);

  function handleExportar() {
    setIsExporting(true);
    try {
      const rows = data.map((b) => ({
        Clave: b.id_consejo ?? '—',
        Consejo: b.nombre_consejo ?? '—',
        'Órgano competente': b.organo_competente,
        Superficie: b.superficie_m2 != null ? `${b.superficie_m2} m²` : '—',
        'Paquetes est.': b.num_paquetes_estimados ?? '—',
        Estado: b.status,
      }));
      descargarXLSX(rows, 'bodegas');
    } catch {
      console.error('Error al exportar');
    } finally {
      setIsExporting(false);
    }
  }

  const columns = useMemo<ColumnDef<IBodegaResumen>[]>(
    () => [
      {
        id: 'clave',
        accessorFn: (row) => row.id_consejo ?? 0,
        header: 'Clave',
        size: 72,
        cell: ({ row }) => (
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 block text-center">{row.original.id_consejo != null ? `#${row.original.id_consejo}` : '—'}</span>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-10 animate-pulse motion-reduce:animate-none" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        size: 130,
        cell: ({ row }) => <span className="text-[0.8125rem] text-foreground">{row.original.tipo}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-24 animate-pulse motion-reduce:animate-none" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'nombre_consejo',
        header: 'Consejo',
        cell: ({ row }) => {
          const b = row.original;
          if (b.tipo === 'Oficina central') return <span className="text-sm text-muted-foreground italic">—</span>;
          return (
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{b.nombre_consejo ?? `Consejo #${b.id_consejo}`}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{b.tipo_consejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal'} {b.id_consejo}</p>
            </div>
          );
        },
        meta: {
          skeleton: <div className="space-y-1.5"><Skeleton className="w-44 h-4 animate-pulse motion-reduce:animate-none" /><Skeleton className="w-28 h-3 animate-pulse motion-reduce:animate-none" /></div>,
        },
        enableSorting: true,
      },
      {
        accessorKey: 'organo_competente',
        header: 'Órgano Competente',
        cell: ({ row }) => <p className="text-sm text-foreground">{row.original.organo_competente}</p>,
        meta: { skeleton: <Skeleton className="h-4 w-44 animate-pulse motion-reduce:animate-none" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'superficie_m2',
        header: 'Superficie',
        size: 100,
        cell: ({ row }) => <span className="text-[0.8125rem] text-muted-foreground">{row.original.superficie_m2 != null ? `${row.original.superficie_m2} m²` : '—'}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-14 animate-pulse motion-reduce:animate-none" /> },
      },
      {
        accessorKey: 'num_paquetes_estimados',
        header: 'Paquetes Est.',
        size: 110,
        cell: ({ row }) => <span className="text-[0.8125rem] text-muted-foreground">{row.original.num_paquetes_estimados ?? '—'}</span>,
        meta: { skeleton: <Skeleton className="h-4 w-10 animate-pulse motion-reduce:animate-none" /> },
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 120,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        meta: { skeleton: <Skeleton className="h-5 w-24 rounded-md animate-pulse motion-reduce:animate-none" /> },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        size: canEditar || canEliminar || canVerificaciones ? 140 : 80,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const esTerminal = ['Determinada', 'Verificada', 'Aceptada', 'Rechazada'].includes(row.original.status);
          const puedeVerificar = esTerminal && canVerificaciones;
          const isOwnConsejo = !isCapturista || (
            row.original.tipo_consejo?.toUpperCase() === user?.tipoConsejo.toUpperCase() &&
            row.original.id_consejo === Number(user?.idConsejo)
          );
          // La bodega puede eliminarse únicamente hasta el estatus "Determinada".
          const esPostDeterminada = ['Verificada', 'Aceptada', 'Rechazada'].includes(row.original.status);
          const puedeEliminar = canEliminar && !esPostDeterminada && isOwnConsejo;
          return (
            <div className="flex items-center justify-end gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/bodegas/${row.original.id}`}>
                    <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80" aria-label={`Ver bodega ${row.original.id}`}>
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">Ver bodega</TooltipContent>
              </Tooltip>
              {puedeVerificar && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/bodegas/${row.original.id}/verificaciones`}>
                      <Button variant="ghost" size="icon" className="text-emerald-600 hover:text-emerald-700" aria-label={`Verificaciones bodega ${row.original.id}`}>
                        <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">Verificaciones</TooltipContent>
                </Tooltip>
              )}
              {canEditar && !esTerminal && isOwnConsejo && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/bodegas/${row.original.id}/editar`}>
                      <Button variant="outline" size="icon" aria-label={`Editar bodega ${row.original.id}`}><Pencil className="h-4 w-4" aria-hidden="true" /></Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">Editar bodega</TooltipContent>
                </Tooltip>
              )}
              {puedeEliminar && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Eliminar bodega ${row.original.id}`}
                      onClick={() => setBodegaAEliminar(row.original)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Eliminar bodega</TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
      },
    ],
    [canEditar, canEliminar, isCapturista, user?.tipoConsejo, user?.idConsejo],
  );

  const table = useReactTable({ columns, data: dataFiltrada, getCoreRowModel: getCoreRowModel(), getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(), initialState: { pagination: { pageSize: 15 } } });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4 border border-destructive/30 rounded-lg bg-destructive/5" role="alert">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" aria-hidden="true" />
        <h3 className="text-base font-semibold mb-1">No se pudo cargar la información</h3>
        <p className="text-sm text-muted-foreground mb-4">Ocurrió un error al obtener las bodegas. Intenta nuevamente.</p>
        <Button onClick={onRetry} variant="outline" className="min-h-[44px]">Reintentar</Button>
      </div>
    );
  }

  const hasActiveFilter = activeFilters ? activeFilters.length < 7 : statusFiltro !== '__all__';
  const emptyContent =
    busqueda.trim() || hasActiveFilter ? (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3" aria-hidden="true"><Search className="h-7 w-7 text-muted-foreground" /></div>
        <p className="text-sm font-medium text-foreground mb-3">Sin resultados para los filtros aplicados</p>
        <Button variant="ghost" size="sm" onClick={() => { setBusqueda(''); setStatusFiltro('__all__'); }} className="text-primary">Limpiar filtros</Button>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4" aria-hidden="true"><Folder className="h-8 w-8 text-muted-foreground" /></div>
        <h3 className="text-base font-semibold text-foreground mb-2">Sin bodegas registradas</h3>
        <p className="text-sm text-muted-foreground max-w-xs">No hay bodegas para el tipo de consejo seleccionado.</p>
      </div>
    );

  const headerContent = (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <Input ref={searchRef} type="search" placeholder="Buscar consejo u órgano…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} disabled={isLoading} aria-label="Buscar bodegas" className="pl-9 pr-8 w-full sm:w-56" />
        {busqueda && (
          <Button type="button" variant="ghost" size="icon" onClick={() => { setBusqueda(''); searchRef.current?.focus(); }} className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground" aria-label="Limpiar búsqueda"><X className="h-3.5 w-3.5" /></Button>
        )}
      </div>
      {!activeFilters && (
        <Select indicatorVisibility={false} value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as TStatusBodega | '__all__')} disabled={isLoading}>
          <SelectTrigger className="w-full sm:w-44 h-9" aria-label="Filtrar por estado"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((op) => (
              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="ml-auto">
        <Button variant="outline" size="sm" onClick={handleExportar} disabled={isLoading || isExporting} className="gap-1.5" aria-label="Exportar a Excel">
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
          <span>Exportar</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden space-y-3">
        <Card><CardHeader className="flex-wrap gap-3 py-4">{headerContent}</CardHeader></Card>
        {isLoading ? <MobileSkeletons /> : dataFiltrada.length === 0 ? emptyContent : dataFiltrada.map((row) => (
          <MobileCard
            key={row.id}
            row={row}
            canEditar={canEditar}
            canEliminar={canEliminar}
            canVerificaciones={canVerificaciones}
            isOwnConsejo={!isCapturista || (row.tipo_consejo?.toUpperCase() === user?.tipoConsejo.toUpperCase() && row.id_consejo === Number(user?.idConsejo))}
            onEliminar={setBodegaAEliminar}
          />
        ))}
      </div>
      <div className="hidden md:block">
        <DataGrid table={table} recordCount={dataFiltrada.length} isLoading={isLoading} emptyMessage={emptyContent} tableClassNames={{ edgeCell: 'px-5' }}>
          <Card>
            <CardHeader className="flex-wrap gap-3 py-5">{headerContent}</CardHeader>
            <CardTable>
              <ScrollArea>
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
            <CardFooter>
              <DataGridPagination sizesLabel="Mostrar" sizesDescription="por página" info="{from} - {to} de {count}" />
            </CardFooter>
          </Card>
        </DataGrid>
      </div>

      {/* Confirmación eliminar bodega */}
      <AlertDialog open={!!bodegaAEliminar} onOpenChange={(open) => { if (!open) setBodegaAEliminar(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              ¿Eliminar bodega?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la bodega <strong>#{bodegaAEliminar?.id}</strong>. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!bodegaAEliminar) return;
                eliminarBodega(bodegaAEliminar.id, {
                  onSuccess: () => setBodegaAEliminar(null),
                });
              }}
              disabled={eliminando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
