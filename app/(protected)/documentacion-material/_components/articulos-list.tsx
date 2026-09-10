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
  Ban,
  CircleCheck,
  FileArchive,
  FileSpreadsheet,
  Package,
  Pencil,
  Plus,
  Search,
} from 'lucide-react';
import type { IArticulo, ITipoDocumentacion } from '@/types/material-electoral';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useArticulos,
  useCambiarEstatusArticulo,
} from '../_hooks/use-articulos';
import { ArticuloFormDialog } from './articulo-form-dialog';
import { ArticuloMiniatura } from './articulo-miniatura';
import { ArticulosFotografiasDialog } from './articulos-fotografias-dialog';
import { ArticulosImportarDialog } from './articulos-importar-dialog';

const TODOS_LOS_TIPOS = '__todos__';

export interface ArticulosPermisos {
  agregar: boolean;
  editar: boolean;
  inactivar: boolean;
  fotografia: boolean;
}

/**
 * Catálogo de artículos: listado con búsqueda, filtro por tipo e interruptor
 * para ver los inactivos, más el alta, la edición, la activación y las dos
 * importaciones (Excel de artículos y zip de fotografías). Las acciones de
 * escritura se ofrecen solo con el permiso correspondiente; quien monta la
 * lista ya comprobó que el usuario es de oficina central.
 */
export function ArticulosList({
  tipos,
  permisos,
}: {
  tipos: ITipoDocumentacion[];
  permisos: ArticulosPermisos;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>(TODOS_LOS_TIPOS);
  const [verInactivos, setVerInactivos] = useState(false);

  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<IArticulo | null>(null);
  const [cambiandoEstatus, setCambiandoEstatus] = useState<IArticulo | null>(
    null,
  );
  const [importarAbierto, setImportarAbierto] = useState(false);
  const [fotografiasAbierto, setFotografiasAbierto] = useState(false);

  const { data, isLoading, isError, error, refetch } =
    useArticulos(verInactivos);
  const estatusMutation = useCambiarEstatusArticulo();

  const puedeEscribir =
    permisos.agregar || permisos.editar || permisos.inactivar;

  function abrirAlta() {
    setEditando(null);
    setFormAbierto(true);
  }

  function abrirEdicion(articulo: IArticulo) {
    setEditando(articulo);
    setFormAbierto(true);
  }

  const columns = useMemo<ColumnDef<IArticulo>[]>(() => {
    const cols: ColumnDef<IArticulo>[] = [
      {
        id: 'foto',
        header: 'Foto',
        size: 70,
        cell: ({ row }) => <ArticuloMiniatura articulo={row.original} />,
        meta: { skeleton: <Skeleton className="h-10 w-10 rounded-md" /> },
        enableSorting: false,
      },
      {
        accessorKey: 'codigo',
        header: 'Código',
        size: 130,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.codigo}</span>
        ),
        meta: { skeleton: <Skeleton className="w-20 h-4" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'descripcion',
        header: 'Descripción',
        // La descripción identifica al artículo: se muestra completa, en varias líneas si hace falta.
        size: 520,
        cell: ({ row }) => (
          <span className="block whitespace-normal break-words leading-snug">
            {row.original.descripcion}
          </span>
        ),
        meta: { skeleton: <Skeleton className="w-64 h-4" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        size: 190,
        cell: ({ row }) => (
          <Badge variant="secondary" appearance="light">
            {row.original.desc_tipo ?? row.original.tipo}
          </Badge>
        ),
        meta: { skeleton: <Skeleton className="w-24 h-5" /> },
        enableSorting: true,
      },
      {
        accessorKey: 'activo',
        header: 'Activo',
        size: 110,
        cell: ({ row }) =>
          row.original.activo ? (
            <Badge variant="success" appearance="light">
              <CircleCheck />
              Activo
            </Badge>
          ) : (
            <Badge variant="secondary" appearance="light">
              <Ban />
              Inactivo
            </Badge>
          ),
        meta: { skeleton: <Skeleton className="w-16 h-5" /> },
        enableSorting: true,
      },
    ];

    if (puedeEscribir) {
      cols.push({
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => {
          const articulo = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {permisos.editar && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => abrirEdicion(articulo)}
                      aria-label={`Editar ${articulo.codigo}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar</TooltipContent>
                </Tooltip>
              )}
              {permisos.inactivar && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={
                        articulo.activo
                          ? 'text-destructive hover:text-destructive'
                          : undefined
                      }
                      onClick={() => setCambiandoEstatus(articulo)}
                      disabled={estatusMutation.isPending}
                      aria-label={
                        articulo.activo
                          ? `Inactivar ${articulo.codigo}`
                          : `Activar ${articulo.codigo}`
                      }
                    >
                      {articulo.activo ? (
                        <Ban className="h-4 w-4" />
                      ) : (
                        <CircleCheck className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {articulo.activo ? 'Inactivar' : 'Activar'}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    return cols;
  }, [
    puedeEscribir,
    permisos.editar,
    permisos.inactivar,
    estatusMutation.isPending,
  ]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (data ?? []).filter((a) => {
      if (tipoFiltro !== TODOS_LOS_TIPOS && a.tipo !== tipoFiltro) return false;
      if (!texto) return true;
      return (
        a.codigo.toLowerCase().includes(texto) ||
        a.descripcion.toLowerCase().includes(texto)
      );
    });
  }, [data, busqueda, tipoFiltro]);

  const table = useReactTable({
    columns,
    data: filtrados,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-lg font-semibold mb-1">
          No se pudo cargar el catálogo de artículos
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {(error as Error)?.message ?? 'Ocurrió un error inesperado.'}
        </p>
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  const hayFiltros = !!busqueda.trim() || tipoFiltro !== TODOS_LOS_TIPOS;

  return (
    <>
      <DataGrid
        table={table}
        recordCount={filtrados.length}
        isLoading={isLoading}
        emptyMessage={
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Package className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Sin artículos</p>
            <p className="text-sm text-muted-foreground mb-3">
              {hayFiltros
                ? 'No hay resultados para tu búsqueda.'
                : verInactivos
                  ? 'El catálogo está vacío.'
                  : 'No hay artículos activos en el catálogo.'}
            </p>
            {!hayFiltros && permisos.agregar && (
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={abrirAlta}>
                  <Plus className="h-4 w-4" />
                  Nuevo artículo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setImportarAbierto(true)}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Importar artículos
                </Button>
              </div>
            )}
          </div>
        }
        tableClassNames={{ edgeCell: 'px-5' }}
        tableLayout={{ width: 'fixed' }}
      >
        <Card>
          <CardHeader className="flex-wrap gap-2.5 py-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Buscar por código o descripción..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  disabled={isLoading}
                  className="ps-9 w-full sm:w-56 md:w-72"
                />
              </div>

              <Select
                indicatorVisibility={false}
                value={tipoFiltro}
                onValueChange={setTipoFiltro}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full sm:w-52" aria-label="Tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS_LOS_TIPOS}>
                    Todos los tipos
                  </SelectItem>
                  {tipos.map((t) => (
                    <SelectItem key={t.clave} value={t.clave}>
                      {t.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch
                  id="articulos-ver-inactivos"
                  size="sm"
                  checked={verInactivos}
                  onCheckedChange={setVerInactivos}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="articulos-ver-inactivos"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Ver inactivos
                </Label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {permisos.fotografia && (
                <Button
                  variant="outline"
                  onClick={() => setFotografiasAbierto(true)}
                  disabled={isLoading}
                >
                  <FileArchive />
                  Importar fotografías
                </Button>
              )}
              {permisos.agregar && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setImportarAbierto(true)}
                    disabled={isLoading}
                  >
                    <FileSpreadsheet />
                    Importar artículos
                  </Button>
                  <Button onClick={abrirAlta} disabled={isLoading}>
                    <Plus />
                    Nuevo
                  </Button>
                </>
              )}
            </div>
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

      <ArticuloFormDialog
        open={formAbierto}
        onOpenChange={(v) => {
          setFormAbierto(v);
          if (!v) setEditando(null);
        }}
        articulo={editando}
        tipos={tipos}
        puedeFotografia={permisos.fotografia}
      />

      <ArticulosImportarDialog
        open={importarAbierto}
        onOpenChange={setImportarAbierto}
      />

      <ArticulosFotografiasDialog
        open={fotografiasAbierto}
        onOpenChange={setFotografiasAbierto}
      />

      <AlertDialog
        open={cambiandoEstatus !== null}
        onOpenChange={(v) => {
          if (!v) setCambiandoEstatus(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {cambiandoEstatus?.activo
                ? '¿Inactivar el artículo?'
                : '¿Activar el artículo?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cambiandoEstatus?.activo ? (
                <>
                  <strong>{cambiandoEstatus.codigo}</strong> dejará de aparecer
                  en el formato de carga. Las cargas anteriores conservan su
                  referencia y podrás activarlo de nuevo cuando haga falta.
                </>
              ) : (
                <>
                  <strong>{cambiandoEstatus?.codigo}</strong> volverá a aparecer
                  en el formato de carga.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={cambiandoEstatus?.activo ? 'destructive' : 'primary'}
              onClick={() => {
                if (cambiandoEstatus) {
                  estatusMutation.mutate({
                    id: cambiandoEstatus.id,
                    activo: !cambiandoEstatus.activo,
                  });
                }
                setCambiandoEstatus(null);
              }}
            >
              {cambiandoEstatus?.activo ? 'Inactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
