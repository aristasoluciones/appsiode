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
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useUsuariosFormData, useDeleteUsuario } from './usuarios-data';
import type { IUsuario } from './usuarios-data';
import UsuarioForm from './usuarios-form';

export default function UsuariosList() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<IUsuario | null>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<IUsuario | null>(null);

  const { data: formData, isLoading, isError, error, refetch } = useUsuariosFormData();
  const deleteMutation = useDeleteUsuario();

  const usuarios = formData?.usuarios ?? [];
  const roles = formData?.roles ?? [];

  function handleEdit(usuario: IUsuario) {
    setEditingUsuario(usuario);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingUsuario(null);
  }

  const columns = useMemo<ColumnDef<IUsuario>[]>(
    () => [
      {
        id: 'nombre',
        header: 'Nombre',
        accessorFn: (row) => `${row.paterno} ${row.materno} ${row.nombre}`,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.paterno} {row.original.materno} {row.original.nombre}
          </span>
        ),
        meta: { skeleton: <Skeleton className="w-44 h-4" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'usuario',
        header: 'Correo / Usuario',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">{row.original.usuario}</span>
        ),
        meta: { skeleton: <Skeleton className="w-48 h-4" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'celular',
        header: 'Celular',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.celular || '—'}</span>
        ),
        meta: { skeleton: <Skeleton className="w-28 h-4" /> },
        enableSorting: false,
      },
      {
        accessorKey: 'rol',
        header: 'Rol',
        cell: ({ row }) =>
          row.original.rol ? (
            <Badge variant="secondary">{row.original.rol}</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
        meta: { skeleton: <Skeleton className="w-24 h-5 rounded-full" /> },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
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
              className="text-destructive hover:text-destructive"
              onClick={() => setDeletingUsuario(row.original)}
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
      usuarios.filter((u) => {
        const q = search.toLowerCase();
        return (
          u.nombre.toLowerCase().includes(q) ||
          u.paterno.toLowerCase().includes(q) ||
          u.materno.toLowerCase().includes(q) ||
          u.usuario.toLowerCase().includes(q) ||
          (u.rol ?? '').toLowerCase().includes(q) ||
          (u.celular ?? '').toLowerCase().includes(q)
        );
      }),
    [usuarios, search],
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
        <h3 className="text-lg font-semibold mb-1">Error al cargar los usuarios</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {(error as any)?.message ?? 'Ocurrió un error inesperado.'}
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
            <Users className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Sin usuarios</p>
            <p className="text-sm text-muted-foreground mb-3">
              {search
                ? 'No hay resultados para tu búsqueda.'
                : 'Comienza creando el primer usuario.'}
            </p>
            {!search && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Crear usuario
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
                placeholder="Buscar usuario..."
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

      <UsuarioForm
        open={showForm}
        onOpenChange={(v) => {
          if (!v) handleCloseForm();
          else setShowForm(true);
        }}
        initialData={editingUsuario ?? undefined}
        roles={roles}
        onSuccess={handleCloseForm}
      />

      <AlertDialog
        open={deletingUsuario !== null}
        onOpenChange={(v) => {
          if (!v) setDeletingUsuario(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar al usuario{' '}
              <strong>
                "{deletingUsuario?.paterno} {deletingUsuario?.materno}{' '}
                {deletingUsuario?.nombre}"
              </strong>
              . Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deletingUsuario) deleteMutation.mutate(deletingUsuario.id);
                setDeletingUsuario(null);
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
