'use client';

import { useMemo, useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  AlertTriangle,
  CalendarCog,
  Pencil,
  Plus,
  Search,
  ShieldOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import {
  etiquetaModo,
  etiquetaStatus,
  etiquetaTipo,
  useProcesos,
} from './procesos-data';
import type { IProcesoCatalogo } from './procesos-data';
import ProcesoForm from './procesos-form';

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/** Formatea una fecha ISO (yyyy-mm-dd) sin desfase por zona horaria. */
function formatFecha(valor: string | null): string {
  if (!valor) return '—';
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-').map(Number);
  if (!anio || !mes || !dia) return String(valor);
  return `${String(dia).padStart(2, '0')} ${MESES[mes - 1]} ${anio}`;
}

export default function ProcesosList() {
  const { hasPermission } = useAuth();
  const canVer = hasPermission('catalogos.procesos.ver');
  const canAgregar = hasPermission('catalogos.procesos.agregar');
  const canEditar = hasPermission('catalogos.procesos.editar');

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProceso, setEditingProceso] = useState<IProcesoCatalogo | null>(null);

  const { data, isLoading, isError, error, refetch } = useProcesos(canVer);
  const procesos = useMemo(() => data ?? [], [data]);

  function handleNuevo() {
    setEditingProceso(null);
    setShowForm(true);
  }

  function handleEdit(proceso: IProcesoCatalogo) {
    setEditingProceso(proceso);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingProceso(null);
  }

  const columns = useMemo<ColumnDef<IProcesoCatalogo>[]>(
    () => [
      {
        id: 'proceso',
        header: 'Proceso',
        accessorFn: (row) => `${etiquetaTipo(row.tipo)} ${row.anio}`,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">
              {etiquetaTipo(row.original.tipo)} {row.original.anio}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatFecha(row.original.fecha)}
            </span>
          </div>
        ),
        meta: { skeleton: <Skeleton className="w-40 h-4" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'modo',
        header: 'Modo',
        cell: ({ row }) => (
          <Badge variant={row.original.modo === 'PROD' ? 'primary' : 'secondary'}>
            {etiquetaModo(row.original.modo)}
          </Badge>
        ),
        meta: { skeleton: <Skeleton className="w-24 h-5 rounded-full" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Estatus',
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'ACT' ? 'success' : 'outline'}>
            {etiquetaStatus(row.original.status)}
          </Badge>
        ),
        meta: { skeleton: <Skeleton className="w-20 h-5 rounded-full" /> },
        enableSorting: true,
      },
      {
        id: 'consejos',
        header: 'Consejos',
        accessorFn: (row) =>
          `${row.consejo_distrital ? 'distrital' : ''} ${row.consejo_municipal ? 'municipal' : ''}`,
        cell: ({ row }) => {
          const { consejo_distrital, consejo_municipal } = row.original;
          if (!consejo_distrital && !consejo_municipal) {
            return <span className="text-muted-foreground text-sm">Ninguno</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {consejo_distrital && <Badge variant="outline">Distritales</Badge>}
              {consejo_municipal && <Badge variant="outline">Municipales</Badge>}
            </div>
          );
        },
        meta: { skeleton: <Skeleton className="w-28 h-5 rounded-full" /> },
        enableSorting: false,
      },
      {
        id: 'enlaces',
        header: 'Enlaces externos',
        accessorFn: (row) =>
          `${row.configuracion?.rpp_api_base ?? ''} ${row.configuracion?.sice_api_base ?? ''}`,
        cell: ({ row }) => {
          const cfg = row.original.configuracion;
          if (!cfg?.rpp_api_base && !cfg?.sice_api_base) {
            return <span className="text-muted-foreground text-sm">Sin capturar</span>;
          }
          return (
            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground max-w-[260px]">
              <span className="truncate" title={cfg?.rpp_api_base ?? ''}>
                RPP: {cfg?.rpp_api_base || '—'}
              </span>
              <span className="truncate" title={cfg?.sice_api_base ?? ''}>
                SICE: {cfg?.sice_api_base || '—'}
              </span>
            </div>
          );
        },
        meta: { skeleton: <Skeleton className="w-52 h-4" /> },
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        size: 60,
        cell: ({ row }) =>
          canEditar ? (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleEdit(row.original)}
                title="Editar proceso"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ) : null,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [canEditar],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return procesos;
    return procesos.filter((p) =>
      [
        etiquetaTipo(p.tipo),
        String(p.anio),
        etiquetaModo(p.modo),
        etiquetaStatus(p.status),
        p.configuracion?.rpp_api_base ?? '',
        p.configuracion?.sice_api_base ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [procesos, search]);

  const table = useReactTable({
    columns,
    data: filtered,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // ── Sin permiso ─────────────────────────────────────────────────────────────
  if (!canVer) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-12 text-center space-y-3">
        <ShieldOff className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm font-medium text-destructive">
          No tienes permiso para consultar los procesos electorales.
        </p>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold mb-1">
          Error al cargar los procesos electorales
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {(error as Error)?.message ?? 'Ocurrió un error inesperado.'}
        </p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <>
      <DataGrid
        table={table}
        recordCount={filtered.length}
        isLoading={isLoading}
        emptyMessage={
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CalendarCog className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Sin procesos electorales</p>
            <p className="text-sm text-muted-foreground mb-3">
              {search
                ? 'No hay resultados para tu búsqueda.'
                : 'Comienza registrando el primer proceso.'}
            </p>
            {!search && canAgregar && (
              <Button size="sm" onClick={handleNuevo}>
                <Plus className="h-4 w-4" />
                Nuevo proceso
              </Button>
            )}
          </div>
        }
        tableClassNames={{ edgeCell: 'px-5' }}
      >
        <Card>
          <CardHeader className="flex-wrap gap-2.5 py-5">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar proceso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={isLoading}
                className="ps-9 w-full sm:w-40 md:w-64"
              />
            </div>
            {canAgregar && (
              <Button onClick={handleNuevo} disabled={isLoading}>
                <Plus />
                Nuevo
              </Button>
            )}
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

      <ProcesoForm
        open={showForm}
        onOpenChange={(v) => {
          if (!v) handleCloseForm();
          else setShowForm(true);
        }}
        initialData={editingProceso ?? undefined}
        onSuccess={handleCloseForm}
      />
    </>
  );
}
