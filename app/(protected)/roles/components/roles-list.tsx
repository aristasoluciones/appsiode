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
  Folder,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRolesData, useDeleteRol } from './roles-data';
import type { IRol } from './roles-data';
import RolForm from './roles-form';
import PermisosDialog from './permisos-dialog';

export default function RolesList() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRol, setEditingRol] = useState<IRol | null>(null);
  const [permisosRol, setPermisosRol] = useState<IRol | null>(null);
  const [deletingRol, setDeletingRol] = useState<IRol | null>(null);

  const { data, isLoading, isError, error, refetch } = useRolesData();
  const deleteMutation = useDeleteRol();

  function handleEdit(rol: IRol) {
    setEditingRol(rol);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingRol(null);
  }

  function handleDelete(rol: IRol) {
    setDeletingRol(rol);
  }

  const columns = useMemo<ColumnDef<IRol>[]>(
    () => [
      {
        accessorKey: 'rol',
        header: 'Nombre',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.rol}</span>
        ),
        meta: { skeleton: <Skeleton className="w-32 h-4" /> },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        size: 120,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="outline" size="icon" onClick={() => handleEdit(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setPermisosRol(row.original)}>
              <ShieldCheck  className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(row.original)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deleteMutation.isPending],
  );

  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (r) =>
          r.rol.toLowerCase().includes(search.toLowerCase()) ||
          (r.descripcion ?? '').toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  );

  const table = useReactTable({
    columns,
    data: filtered,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });


  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold mb-1">Error al cargar los roles</h3>
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
            <Folder className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Sin roles</p>
            <p className="text-sm text-muted-foreground mb-3">
              {search
                ? 'No hay resultados para tu búsqueda.'
                : 'Comienza creando el primer rol.'}
            </p>
            {!search && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Crear rol
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
                placeholder="Buscar rol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={isLoading}
                className="ps-9 w-full sm:w-40 md:w-64"
              />
            </div>
            <Button onClick={() => setShowForm(true)} disabled={isLoading}>
              <Plus />
              Nuevo
            </Button>
          </CardHeader>
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

      <RolForm
        open={showForm}
        onOpenChange={(v) => { if (!v) handleCloseForm(); else setShowForm(true); }}
        initialData={editingRol ?? undefined}
        onSuccess={handleCloseForm}
      />

      <PermisosDialog
        rol={permisosRol}
        open={permisosRol !== null}
        onOpenChange={(v) => { if (!v) setPermisosRol(null); }}
      />

      <AlertDialog open={deletingRol !== null} onOpenChange={(v) => { if (!v) setDeletingRol(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar rol?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el rol <strong>"{deletingRol?.rol}"</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deletingRol) deleteMutation.mutate(deletingRol.id);
                setDeletingRol(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
