// ============================================================
// TEMPLATE: app/(protected)/[module-name]/components/[module-name]-list.tsx
//
// ⚠️  COLUMNAS VAN INLINE — No crear [module]-columns.tsx separado.
//
// Replace all [Bracketed] placeholders before use:
//   [ModuleName]  → e.g. Rol (singular PascalCase)
//   [Module]      → e.g. Roles (plural PascalCase)
//   [module-name] → e.g. roles (kebab-case)
// ============================================================
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
import { AlertTriangle, Folder, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { use[Module]Data, useDelete[ModuleName] } from './[module-name]-data';
import type { I[ModuleName] } from './[module-name]-data';
import [ModuleName]Form from './[module-name]-form';

// ── Component ─────────────────────────────────────────────────────────────────

export default function [Module]List() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<I[ModuleName] | null>(null);
  const [deletingItem, setDeletingItem] = useState<I[ModuleName] | null>(null);

  const { data, isLoading, isError, error, refetch } = use[Module]Data();
  const deleteMutation = useDelete[ModuleName]();

  function handleEdit(item: I[ModuleName]) {
    setEditingItem(item);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingItem(null);
  }

  // ── Columns (inline — no [module]-columns.tsx separado) ───────────────────
  const columns = useMemo<ColumnDef<I[ModuleName]>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 60,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">#{row.original.id}</span>
        ),
        meta: { skeleton: <Skeleton className="w-8 h-4" /> },
        enableSorting: false,
        enableHiding: false,
      },

      // TODO: agregar columnas de la entidad
      // {
      //   accessorKey: 'nombre',
      //   header: 'Nombre',
      //   cell: ({ row }) => (
      //     <span className="font-medium">{row.original.nombre}</span>
      //   ),
      //   meta: { skeleton: <Skeleton className="w-32 h-4" /> },
      //   enableSorting: true,
      // },

      // ── Columna de acciones: botones independientes (NO DropdownMenu) ──────
      {
        id: 'actions',
        header: '',
        size: 88,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleEdit(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDeletingItem(row.original)}
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

  // ── Filtrado client-side ───────────────────────────────────────────────────
  const filtered = useMemo(
    () =>
      (data ?? []).filter((item) =>
        // TODO: ajustar campos de búsqueda
        String(item.id).includes(search.toLowerCase()),
      ),
    [data, search],
  );

  // ── Table instance ─────────────────────────────────────────────────────────
  const table = useReactTable({
    columns,
    data: filtered,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // ── Error state (antes del return principal) ───────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold mb-1">Error al cargar los datos</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {(error as any)?.message ?? 'Ocurrió un error inesperado.'}
        </p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  // ── Layout: DataGrid (outermost) → Card → CardHeader/CardTable/CardFooter ─
  //
  // ⚠️  NO definir el toolbar como `const Toolbar = () => (...)` dentro del
  //     componente — cada render crea una nueva referencia de función y React
  //     desmonta+remonta el componente, perdiendo el foco del Input.
  //     El JSX del toolbar va directo en el CardHeader.
  //
  return (
    <>
      <DataGrid
        table={table}
        recordCount={filtered.length}
        isLoading={isLoading}
        emptyMessage={
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Folder className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Sin registros</p>
            <p className="text-sm text-muted-foreground mb-3">
              {search ? 'No hay resultados para tu búsqueda.' : 'Comienza creando el primer registro.'}
            </p>
            {!search && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Crear registro
              </Button>
            )}
          </div>
        }
        tableClassNames={{ edgeCell: 'px-5' }}
      >
        <Card>
          {/* Toolbar inline en CardHeader — NO como componente interno */}
          <CardHeader className="flex-wrap gap-2.5 py-5">
            <div className="relative">
              <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={isLoading}
                className="ps-9 w-full sm:w-40 md:w-64"
              />
            </div>
            <Button onClick={() => setShowForm(true)} disabled={isLoading}>
              <Plus className="h-4 w-4" />
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
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      {/* ── Form dialog ─────────────────────────────────── */}
      <[ModuleName]Form
        open={showForm}
        onOpenChange={(v) => { if (!v) handleCloseForm(); else setShowForm(true); }}
        initialData={editingItem ?? undefined}
        onSuccess={handleCloseForm}
      />

      {/* ── Delete confirmation — AlertDialog (NO confirm() nativo) ─────── */}
      <AlertDialog
        open={deletingItem !== null}
        onOpenChange={(v) => { if (!v) setDeletingItem(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deletingItem) deleteMutation.mutate(deletingItem.id);
                setDeletingItem(null);
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
