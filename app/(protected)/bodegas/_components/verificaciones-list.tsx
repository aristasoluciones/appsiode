'use client';

import { useMemo, useState } from 'react';
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
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
  Folder,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/auth-provider';
import { formatDateOnly } from '@/lib/helpers';
import { useVerificaciones, useEliminarVerificacion } from '../_hooks/use-verificaciones';
import type { IVerificacionResumen, TVerificacionStatus } from '@/types/verificaciones';

// ─── Status badge ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TVerificacionStatus, { label: string; variant: Parameters<typeof Badge>[0]['variant']; appearance: Parameters<typeof Badge>[0]['appearance'] }> = {
  'En captura': {
    label: 'En captura',
    variant: 'primary',
    appearance: 'light',
  },
  'Capturada': {
    label: 'Capturada',
    variant: 'secondary',
    appearance: 'light',
  },
  'Revisada': {
    label: 'Revisada',
    variant: 'success',
    appearance: 'light',
  },
};

function StatusBadge({ status }: { status: TVerificacionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant={cfg.variant} appearance={cfg.appearance} size="sm">
      {cfg.label}
    </Badge>
  );
}

function ResultadoBadge({ resultado }: { resultado: string | null }) {
  if (!resultado) return <span className="text-muted-foreground text-xs">—</span>;
  if (resultado === 'Aceptada') {
    return <Badge variant="success" appearance="outline" size="sm">{resultado}</Badge>;
  }
  return <Badge variant="destructive" appearance="outline" size="sm">{resultado}</Badge>;
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

function MobileCard({
  row,
  canEditar,
  canEliminar,
  onEliminar,
}: {
  row: IVerificacionResumen;
  canEditar: boolean;
  canEliminar: boolean;
  onEliminar: (v: IVerificacionResumen) => void;
}) {
  return (
    <article className="border border-border rounded-lg p-4 space-y-3 bg-card">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{row.nombreVerificador}</h3>
          <p className="text-xs text-muted-foreground">{row.cargoVerificador}</p>
        </div>
        <StatusBadge status={row.status} />
      </header>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.8125rem]">
        <div>
          <span className="text-muted-foreground">Fecha: </span>
          <span className="font-medium text-foreground">
            {row.fechaVerificacion ? formatDateOnly(row.fechaVerificacion, 'es-MX') : '—'}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Resultado: </span>
          <ResultadoBadge resultado={row.resultado} />
        </div>
      </div>
      <footer className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        <TooltipProvider>
          {canEditar && row.status === 'Capturada' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/bodegas/${row.idBodega}/verificaciones/${row.id}/revisar`}>
                  <Button variant="outline" size="icon" className="text-emerald-600 hover:text-emerald-700" aria-label="Revisar verificación">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Revisar</TooltipContent>
            </Tooltip>
          )}
          {row.status === 'Revisada' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/bodegas/${row.idBodega}/verificaciones/${row.id}/revisar`}>
                  <Button variant="ghost" size="icon" className="text-primary" aria-label="Consultar verificación">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Consultar</TooltipContent>
            </Tooltip>
          )}
          {canEditar && row.status === 'En captura' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/bodegas/${row.idBodega}/verificaciones/${row.id}`}>
                  <Button variant="outline" size="icon" aria-label="Editar verificación">
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
          )}
          {canEliminar && row.status === 'En captura' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Eliminar verificación"
                  onClick={() => onEliminar(row)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </footer>
    </article>
  );
}

function MobileSkeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5">
              <Skeleton className="w-32 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-24 h-3 animate-pulse motion-reduce:animate-none" />
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

// ─── Props ──────────────────────────────────────────────────────────────────────

interface VerificacionesListProps {
  idBodega: number;
  bodegaStatus?: string;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function VerificacionesList({ idBodega, bodegaStatus }: VerificacionesListProps) {
  const { hasPermission } = useAuth();
  const canRegistrar = hasPermission('bodegas.be.registrarverificacion');
  const canEditar = hasPermission('bodegas.be.actualizarverificacion');
  const canEliminar = hasPermission('bodegas.be.eliminarverificacion');
  const esTerminal = ['Aceptada', 'Rechazada'].includes(bodegaStatus ?? '');

  const { data: verificaciones = [], isLoading, isError, error, refetch } = useVerificaciones(idBodega);
  const { mutate: eliminar, isPending: eliminando } = useEliminarVerificacion(idBodega);
  const [aEliminar, setAEliminar] = useState<IVerificacionResumen | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const dataFiltrada = useMemo(() => {
    if (!busqueda.trim()) return verificaciones;
    const q = busqueda.toLowerCase();
    return verificaciones.filter(
      (v) =>
        v.nombreVerificador.toLowerCase().includes(q) ||
        v.cargoVerificador.toLowerCase().includes(q),
    );
  }, [verificaciones, busqueda]);

  const columns = useMemo<ColumnDef<IVerificacionResumen>[]>(
    () => [
      {
        accessorKey: 'nombreVerificador',
        header: 'Verificador',
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold text-foreground">{row.original.nombreVerificador}</p>
            <p className="text-xs text-muted-foreground">{row.original.cargoVerificador}</p>
          </div>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-32 animate-pulse motion-reduce:animate-none" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'fechaVerificacion',
        header: 'Fecha',
        size: 120,
        cell: ({ row }) => (
          <span className="text-[0.8125rem] text-muted-foreground">
            {row.original.fechaVerificacion
              ? formatDateOnly(row.original.fechaVerificacion, 'es-MX')
              : '—'}
          </span>
        ),
        meta: { skeleton: <Skeleton className="h-4 w-20 animate-pulse motion-reduce:animate-none" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Estatus',
        size: 130,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        meta: { skeleton: <Skeleton className="h-5 w-24 rounded-md animate-pulse motion-reduce:animate-none" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'resultado',
        header: 'Resultado de la verificación',
        size: 110,
        cell: ({ row }) => <ResultadoBadge resultado={row.original.resultado} />,
        meta: { skeleton: <Skeleton className="h-5 w-20 rounded-md animate-pulse motion-reduce:animate-none" /> },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        size: canEditar || canEliminar ? 140 : 60,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const esCapturada = row.original.status === 'Capturada';
          const esEnCaptura = row.original.status === 'En captura';
          return (
            <div className="flex items-center justify-end gap-1">
              <TooltipProvider>
                {canEditar && esCapturada && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/bodegas/${idBodega}/verificaciones/${row.original.id}/revisar`}>
                        <Button variant="outline" size="icon" className="text-emerald-600 hover:text-emerald-700" aria-label="Revisar verificación">
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Revisar</TooltipContent>
                  </Tooltip>
                )}
                {row.original.status === 'Revisada' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/bodegas/${idBodega}/verificaciones/${row.original.id}/revisar`}>
                        <Button variant="ghost" size="icon" className="text-primary" aria-label="Consultar verificación">
                          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Consultar</TooltipContent>
                  </Tooltip>
                )}
                {canEditar && esEnCaptura && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/bodegas/${idBodega}/verificaciones/${row.original.id}`}>
                        <Button variant="outline" size="icon" aria-label="Editar verificación">
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                )}
                {canEliminar && esEnCaptura && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Eliminar verificación"
                        onClick={() => setAEliminar(row.original)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          );
        },
      },
    ],
    [canEditar, canEliminar, idBodega],
  );

  const table = useReactTable({
    columns,
    data: dataFiltrada,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (isError) {
    const apiError = (error as any)?.response?.data?.message as string | undefined;
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4 border border-destructive/30 rounded-lg bg-destructive/5" role="alert">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" aria-hidden="true" />
        <h3 className="text-base font-semibold mb-1">No se pudo cargar la información</h3>
        <p className="text-sm text-muted-foreground mb-4">{apiError ?? 'Ocurrió un error al obtener las verificaciones. Intenta nuevamente.'}</p>
        <Button onClick={() => refetch()} variant="outline" className="min-h-[44px]">Reintentar</Button>
      </div>
    );
  }

  const emptyContent = busqueda.trim() ? (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3" aria-hidden="true">
        <Search className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-3">Sin resultados para la búsqueda</p>
      <Button variant="ghost" size="sm" onClick={() => setBusqueda('')} className="text-primary">Limpiar búsqueda</Button>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4" aria-hidden="true">
        <Folder className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">Sin verificaciones registradas</h3>
      <p className="text-sm text-muted-foreground max-w-xs">No hay verificaciones para esta bodega.</p>
    </div>
  );

  const headerContent = (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
        <Input
          type="search"
          placeholder="Buscar verificador…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          disabled={isLoading}
          aria-label="Buscar verificaciones"
          className="pl-9 pr-8 w-full sm:w-56"
        />
        {busqueda && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setBusqueda('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <div className="ml-auto">
        {canRegistrar && !esTerminal && (
          <Link href={`/bodegas/${idBodega}/verificaciones/nueva`}>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nueva verificación
            </Button>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
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
            <MobileCard key={row.id} row={row} canEditar={canEditar} canEliminar={canEliminar} onEliminar={setAEliminar} />
          ))
        )}
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

      {/* Confirmación eliminar */}
      <AlertDialog open={!!aEliminar} onOpenChange={(open) => { if (!open) setAEliminar(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              Eliminar verificación
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la verificación de <strong>{aEliminar?.nombreVerificador}</strong>. Solo se puede eliminar si está en proceso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!aEliminar) return;
                eliminar(aEliminar.id, {
                  onSuccess: () => setAEliminar(null),
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
