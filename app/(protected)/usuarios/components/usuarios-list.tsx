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
  EllipsisVertical,
  History,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldOff,
  ShieldPlus,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import {
  useUsuariosFormData,
  useUsuariosEliminados,
  useDeleteUsuario,
  useReactivarUsuario,
} from './usuarios-data';
import type { IUsuario } from './usuarios-data';
import {
  useExigenciaMfa,
  useResetearMfa,
  useUsuariosMfa,
  type IUsuarioMfa,
} from './usuarios-mfa-data';
import UsuarioForm from './usuarios-form';
import { UsuarioDetalleDialog } from './usuario-detalle-dialog';
import { UsuariosMasivoDialog } from './usuarios-masivo-dialog';

function nombreCompleto(u: IUsuario | null | undefined): string {
  if (!u) return '';
  return `${u.paterno} ${u.materno} ${u.nombre}`.replace(/\s+/g, ' ').trim();
}

/** Una cuenta eliminada conserva su registro: solo cambia de estatus. */
function estaEliminada(u: IUsuario | null | undefined): boolean {
  return u?.status === 'DEL';
}

export default function UsuariosList() {
  const [search, setSearch] = useState('');
  const [mostrarEliminadas, setMostrarEliminadas] = useState(false);
  const [reactivandoUsuario, setReactivandoUsuario] = useState<IUsuario | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMasivo, setShowMasivo] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<IUsuario | null>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<IUsuario | null>(null);
  const [reseteandoMfa, setReseteandoMfa] = useState<IUsuario | null>(null);
  const [detalleUsuario, setDetalleUsuario] = useState<IUsuario | null>(null);
  const [cambiandoExigencia, setCambiandoExigencia] = useState<{
    usuario: IUsuario;
    exigir: boolean;
  } | null>(null);

  const { hasPermission } = useAuth();
  const canVerMfa = hasPermission('catalogos.usuarios.ver');
  const canResetearMfa = hasPermission('catalogos.usuarios.mfaresetear');
  const canExigirMfa = hasPermission('catalogos.usuarios.mfaexigir');
  const canVerHistorial = hasPermission('catalogos.usuarios.historialver');
  const canVerSesiones = hasPermission('catalogos.usuarios.sesionesver');
  const canAltaMasiva = hasPermission('catalogos.usuarios.masivo');
  const canRevocarSesiones = hasPermission('catalogos.usuarios.sesionesrevocar');
  const canReactivar = hasPermission('catalogos.usuarios.reactivar');
  // El detalle de la cuenta reúne historial y sesiones: basta con uno de los dos.
  const canVerDetalle = canVerHistorial || canVerSesiones;

  const { data: formData, isLoading, isError, error, refetch } = useUsuariosFormData();
  const deleteMutation = useDeleteUsuario();
  const reactivarMutation = useReactivarUsuario();
  const { data: eliminadas, isLoading: eliminadasLoading } =
    useUsuariosEliminados(mostrarEliminadas);
  const { data: mfaEstados, isLoading: mfaLoading } = useUsuariosMfa(canVerMfa);
  const resetearMfaMutation = useResetearMfa();
  const exigenciaMfaMutation = useExigenciaMfa();

  const mfaPorUsuario = useMemo(() => {
    const mapa = new Map<number, IUsuarioMfa>();
    (mfaEstados ?? []).forEach((m) => mapa.set(m.id_usuario, m));
    return mapa;
  }, [mfaEstados]);

  // Las eliminadas van en el mismo listado, señaladas con su estatus.
  const usuarios = useMemo(
    () => [
      ...(formData?.usuarios ?? []),
      ...(mostrarEliminadas ? (eliminadas ?? []) : []),
    ],
    [formData?.usuarios, mostrarEliminadas, eliminadas],
  );
  const roles = formData?.roles ?? [];
  const consejos = useMemo(() => formData?.consejos ?? [], [formData?.consejos]);

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
        // El nombre y el correo llevan un ancho mínimo para que el reparto de
        // la tabla no los deje en una franja estrecha. Si aun así no cabe, el
        // texto se acomoda en varias líneas: nada se corta.
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.paterno} {row.original.materno} {row.original.nombre}
          </span>
        ),
        meta: {
          skeleton: <Skeleton className="w-44 h-4" />,
          headerClassName: 'min-w-[200px]',
          cellClassName: 'min-w-[200px]',
        },
        enableSorting: true,
      },
      {
        accessorKey: 'usuario',
        header: 'Correo / Usuario',
        // Un correo largo se parte solo si de verdad no cabe.
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm break-words">
            {row.original.usuario}
          </span>
        ),
        meta: {
          skeleton: <Skeleton className="w-48 h-4" />,
          headerClassName: 'min-w-[200px]',
          cellClassName: 'min-w-[200px]',
        },
        enableSorting: true,
      },
      {
        accessorKey: 'celular',
        header: 'Celular',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.celular || '—'}</span>
        ),
        meta: {
          skeleton: <Skeleton className="w-28 h-4" />,
          headerClassName: 'min-w-[110px]',
          cellClassName: 'min-w-[110px]',
        },
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
        meta: {
          skeleton: <Skeleton className="w-24 h-5 rounded-full" />,
          headerClassName: 'min-w-[120px]',
          cellClassName: 'min-w-[120px]',
        },
        enableSorting: true,
      },
      {
        id: 'tipo',
        header: 'Tipo',
        accessorFn: (row) => row.tipo ?? '',
        cell: ({ row }) => {
          const { tipo, consejo_tipo, consejo_clave } = row.original;
          if (tipo === 'consejo') {
            const consejo = consejos.find(
              (c) => c.clave_consejo === consejo_clave && c.tipo_consejo === consejo_tipo
            );
            return (
              <div className="flex flex-col gap-0.5">
                <Badge variant="primary" className="w-fit">Consejo</Badge>
                {/* El nombre del consejo es largo: se acota para que no le
                    quite ancho al nombre ni al correo. */}
                <span className="block max-w-[220px] text-xs text-muted-foreground">
                  {consejo_tipo === 'D' ? 'Distrital' : consejo_tipo === 'M' ? 'Municipal' : consejo_tipo}
                  {consejo ? ` · ${consejo_clave} - ${consejo.consejo}` : consejo_clave ? ` · ${consejo_clave}` : ''}
                </span>
              </div>
            );
          }
          if (tipo === 'oficina_central') {
            return <Badge variant="outline">Oficina Central</Badge>;
          }
          return <span className="text-muted-foreground text-sm">{tipo || '—'}</span>;
        },
        meta: {
          skeleton: <Skeleton className="w-32 h-5 rounded-full" />,
          headerClassName: 'min-w-[140px]',
          cellClassName: 'min-w-[140px]',
        },
        enableSorting: true,
      },
      ...(mostrarEliminadas
        ? ([
            {
              id: 'estatus',
              header: 'Estatus',
              accessorFn: (row) => (estaEliminada(row) ? 'Eliminada' : 'Activa'),
              cell: ({ row }) =>
                estaEliminada(row.original) ? (
                  <Badge variant="destructive" appearance="light">
                    Eliminada
                  </Badge>
                ) : (
                  <Badge variant="success" appearance="light">
                    Activa
                  </Badge>
                ),
              meta: {
                skeleton: <Skeleton className="w-20 h-5 rounded-full" />,
                headerClassName: 'min-w-[100px]',
                cellClassName: 'min-w-[100px]',
              },
              enableSorting: true,
            },
          ] as ColumnDef<IUsuario>[])
        : []),
      ...(canVerMfa
        ? ([
            {
              id: 'mfa',
              header: 'Segundo paso',
              cell: ({ row }) => {
                // El segundo paso solo aplica a las cuentas que pueden entrar.
                if (estaEliminada(row.original)) {
                  return <span className="text-muted-foreground text-sm">—</span>;
                }
                if (mfaLoading) {
                  return <Skeleton className="w-24 h-5 rounded-full" />;
                }
                const mfa = mfaPorUsuario.get(row.original.id);
                const activo = !!mfa?.enrolado && !!mfa?.confirmado;
                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      {activo ? (
                        <Badge variant="success" appearance="light">
                          Activo
                        </Badge>
                      ) : mfa?.enrolado ? (
                        <Badge variant="warning" appearance="light">
                          Pendiente
                        </Badge>
                      ) : (
                        <Badge variant="secondary" appearance="light">
                          Sin enrolar
                        </Badge>
                      )}
                      {mfa?.exigido && (
                        <Badge variant="info" appearance="light">
                          Exigido
                        </Badge>
                      )}
                    </div>
                    {activo && (
                      <span className="text-xs text-muted-foreground">
                        Códigos de respaldo: {mfa.respaldo_restantes}
                      </span>
                    )}
                  </div>
                );
              },
              meta: {
                skeleton: <Skeleton className="w-24 h-5 rounded-full" />,
                headerClassName: 'min-w-[150px]',
                cellClassName: 'min-w-[150px]',
              },
              enableSorting: false,
            },
          ] as ColumnDef<IUsuario>[])
        : []),
      {
        id: 'actions',
        header: '',
        size: 130,
        // Ocupa lo justo y deja el ancho sobrante a las columnas de texto.
        meta: {
          headerClassName: 'w-[1%] whitespace-nowrap',
          cellClassName: 'w-[1%] whitespace-nowrap',
        },
        cell: ({ row }) => {
          // Una cuenta eliminada conserva la misma forma de la fila —iconos y
          // menú— pero cambia lo que ofrece: devolverla al servicio en lugar de
          // editarla o volver a eliminarla.
          if (estaEliminada(row.original)) {
            if (!canReactivar && !canVerDetalle) {
              return <span className="text-muted-foreground text-sm">—</span>;
            }
            return (
              <div className="flex items-center justify-end gap-1">
                {canReactivar && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Reactivar cuenta"
                        onClick={() => setReactivandoUsuario(row.original)}
                        disabled={reactivarMutation.isPending}
                      >
                        <UserCheck className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reactivar cuenta</TooltipContent>
                  </Tooltip>
                )}
                {canVerDetalle && (
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Más acciones"
                          >
                            <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Más acciones</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="min-w-56">
                      <DropdownMenuItem
                        onSelect={() =>
                          setTimeout(() => setDetalleUsuario(row.original), 0)
                        }
                      >
                        <History />
                        Historial y sesiones
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          }

          const mfa = mfaPorUsuario.get(row.original.id);
          // Del segundo paso se ofrece una sola acción, la que corresponde al
          // estado de la cuenta: con la aplicación enrolada lo útil es resetear
          // el enrolamiento; sin ella, exigir el segundo paso o liberarlo.
          const enrolado = !!mfa?.enrolado;
          const puedeResetear = canResetearMfa && enrolado;
          const puedeExigir = canExigirMfa && !enrolado;
          const hayMasAcciones = canVerDetalle || puedeExigir || puedeResetear;
          return (
            <div className="flex items-center justify-end gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Editar usuario"
                    onClick={() => handleEdit(row.original)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar usuario</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    aria-label="Eliminar usuario"
                    onClick={() => setDeletingUsuario(row.original)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eliminar usuario</TooltipContent>
              </Tooltip>
              {hayMasAcciones && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Más acciones"
                        >
                          <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Más acciones</TooltipContent>
                  </Tooltip>
                  {/* El estado se cambia al terminar el cierre del menú: así el
                      foco que devuelve no interfiere con el diálogo que abre. */}
                  <DropdownMenuContent align="end" className="min-w-56">
                    {canVerDetalle && (
                      <DropdownMenuItem
                        onSelect={() =>
                          setTimeout(() => setDetalleUsuario(row.original), 0)
                        }
                      >
                        <History />
                        Historial y sesiones
                      </DropdownMenuItem>
                    )}
                    {puedeExigir && (
                      <DropdownMenuItem
                        disabled={mfaLoading || exigenciaMfaMutation.isPending}
                        onSelect={() =>
                          setTimeout(
                            () =>
                              setCambiandoExigencia({
                                usuario: row.original,
                                exigir: !mfa?.exigido,
                              }),
                            0,
                          )
                        }
                      >
                        {mfa?.exigido ? <ShieldOff /> : <ShieldPlus />}
                        {mfa?.exigido
                          ? 'Liberar el segundo paso'
                          : 'Exigir el segundo paso'}
                      </DropdownMenuItem>
                    )}
                    {puedeResetear && (
                      <DropdownMenuItem
                        disabled={mfaLoading || resetearMfaMutation.isPending}
                        onSelect={() =>
                          setTimeout(() => setReseteandoMfa(row.original), 0)
                        }
                      >
                        <RotateCcw />
                        Resetear el segundo paso
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [
      deleteMutation.isPending,
      reactivarMutation.isPending,
      consejos,
      mostrarEliminadas,
      canReactivar,
      canVerMfa,
      canResetearMfa,
      canExigirMfa,
      canVerDetalle,
      mfaPorUsuario,
      mfaLoading,
      resetearMfaMutation.isPending,
      exigenciaMfaMutation.isPending,
    ],
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
        isLoading={isLoading || (mostrarEliminadas && eliminadasLoading)}
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
            <div className="flex items-center gap-2">
              <Switch
                id="mostrar-eliminadas"
                size="sm"
                checked={mostrarEliminadas}
                onCheckedChange={setMostrarEliminadas}
                disabled={isLoading}
              />
              <Label
                htmlFor="mostrar-eliminadas"
                className="text-sm text-muted-foreground font-normal"
              >
                Mostrar cuentas eliminadas
              </Label>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 ms-auto">
              {canAltaMasiva && (
                <Button
                  variant="outline"
                  onClick={() => setShowMasivo(true)}
                  disabled={isLoading}
                >
                  <Upload />
                  Generar cuentas
                </Button>
              )}
              <Button onClick={() => setShowForm(true)} disabled={isLoading}>
                <Plus />
                Nuevo
              </Button>
            </div>
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
        consejos={consejos}
        onSuccess={handleCloseForm}
      />

      <UsuariosMasivoDialog open={showMasivo} onOpenChange={setShowMasivo} />

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

      <AlertDialog
        open={reactivandoUsuario !== null}
        onOpenChange={(v) => {
          if (!v) setReactivandoUsuario(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reactivar la cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              La cuenta de{' '}
              <strong>"{nombreCompleto(reactivandoUsuario)}"</strong> volverá a
              poder entrar al sistema con su mismo rol y su mismo consejo. Su
              historial se conserva y el movimiento queda registrado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (reactivandoUsuario)
                  reactivarMutation.mutate(reactivandoUsuario.id);
                setReactivandoUsuario(null);
              }}
            >
              Reactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={reseteandoMfa !== null}
        onOpenChange={(v) => {
          if (!v) setReseteandoMfa(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Resetear el enrolamiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrará la aplicación autenticadora y los códigos de respaldo
              de <strong>"{nombreCompleto(reseteandoMfa)}"</strong>. En su
              siguiente inicio de sesión podrá volver a enrolar. Útil cuando el
              usuario perdió el teléfono.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (reseteandoMfa) resetearMfaMutation.mutate(reseteandoMfa.id);
                setReseteandoMfa(null);
              }}
            >
              Resetear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={cambiandoExigencia !== null}
        onOpenChange={(v) => {
          if (!v) setCambiandoExigencia(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {cambiandoExigencia?.exigir
                ? '¿Exigir el segundo paso?'
                : '¿Liberar el segundo paso?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cambiandoExigencia?.exigir ? (
                <>
                  La cuenta de{' '}
                  <strong>"{nombreCompleto(cambiandoExigencia?.usuario)}"</strong>{' '}
                  deberá completar el segundo paso en cada inicio de sesión.
                  Mientras no enrole una aplicación autenticadora, el código le
                  llegará por correo electrónico.
                </>
              ) : (
                <>
                  El segundo paso dejará de ser obligatorio para{' '}
                  <strong>"{nombreCompleto(cambiandoExigencia?.usuario)}"</strong>.
                  Si la cuenta tiene su aplicación enrolada, la seguirá usando;
                  solo deja de estar obligada.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cambiandoExigencia) {
                  exigenciaMfaMutation.mutate({
                    idUsuario: cambiandoExigencia.usuario.id,
                    exigido: cambiandoExigencia.exigir,
                  });
                }
                setCambiandoExigencia(null);
              }}
            >
              {cambiandoExigencia?.exigir ? 'Exigir' : 'Liberar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UsuarioDetalleDialog
        usuario={detalleUsuario}
        open={detalleUsuario !== null}
        onOpenChange={(v) => {
          if (!v) setDetalleUsuario(null);
        }}
        puedeVerHistorial={canVerHistorial}
        puedeVerSesiones={canVerSesiones}
        puedeRevocarSesiones={canRevocarSesiones}
      />
    </>
  );
}
