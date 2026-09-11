'use client';

import { useMemo } from 'react';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Eye, FileText, Loader2 } from 'lucide-react';
import type { IActaResumen } from '@/types/material-electoral';
import { formatFechaHora } from '@/lib/fechas';
import { formatDateOnly, formatTimeOnly } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { actaCerrada, ESTATUS_ACTA } from './acta-estatus';

interface ActasTableProps {
  data: IActaResumen[];
  isLoading: boolean;
  emptyContent: React.ReactNode;
  headerContent: React.ReactNode;
  onVerDetalle: (acta: IActaResumen) => void;
  /** Abre el PDF firmado o, si aún no lo hay, el Word generado; ausente = sin permiso. */
  onVerDocumento?: (acta: IActaResumen) => void;
  /** Id del acta cuyo documento se está resolviendo, para el indicador de carga. */
  documentoPendiente: number | null;
}

/** Qué documento se abre: el firmado cuando ya lo subió, si no el generado. */
function etiquetaDocumento(acta: IActaResumen) {
  if (acta.archivo_firmado) return 'Ver PDF firmado';
  if (acta.archivo_generado) return 'Ver Word generado';
  return null;
}

function EstatusBadge({ acta }: { acta: IActaResumen }) {
  const e = ESTATUS_ACTA[acta.estatus];
  return (
    <Badge variant={e?.variant ?? 'secondary'} appearance="light" size="sm">
      {e?.label ?? acta.estatus_desc}
    </Badge>
  );
}

export function ActasTable({
  data,
  isLoading,
  emptyContent,
  headerContent,
  onVerDetalle,
  onVerDocumento,
  documentoPendiente,
}: ActasTableProps) {
  const columns = useMemo<ColumnDef<IActaResumen>[]>(
    () => [
      {
        id: 'row',
        header: '#',
        size: 48,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground block text-center">
            {row.index + 1}
          </span>
        ),
        meta: {
          skeleton: (
            <Skeleton className="w-6 h-4 mx-auto animate-pulse motion-reduce:animate-none" />
          ),
        },
        enableSorting: false,
      },
      {
        id: 'estatus',
        header: 'Estatus',
        size: 130,
        accessorFn: (row) => row.estatus,
        cell: ({ row }) => (
          <div
            className={actaCerrada(row.original.estatus) ? 'opacity-60' : ''}
          >
            <EstatusBadge acta={row.original} />
            {row.original.ciclos_revision > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {row.original.ciclos_revision}{' '}
                {row.original.ciclos_revision === 1
                  ? 'ciclo de revisión'
                  : 'ciclos de revisión'}
              </p>
            )}
          </div>
        ),
        meta: {
          skeleton: (
            <Skeleton className="w-20 h-5 rounded animate-pulse motion-reduce:animate-none" />
          ),
        },
        enableSorting: true,
      },
      {
        id: 'creacion',
        header: 'Creada',
        size: 170,
        accessorFn: (row) => row.created_at,
        cell: ({ row }) => (
          <div
            className={actaCerrada(row.original.estatus) ? 'opacity-60' : ''}
          >
            <p className="text-sm font-medium text-foreground leading-tight">
              {formatFechaHora(row.original.created_at)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acta #{row.original.id}
            </p>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              <Skeleton className="w-32 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-16 h-3 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'acta',
        header: 'Fecha del acta',
        size: 170,
        accessorFn: (row) => `${row.fecha_acta ?? ''} ${row.hora_acta ?? ''}`,
        cell: ({ row }) => {
          const a = row.original;
          if (!a.fecha_acta) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <div className={actaCerrada(a.estatus) ? 'opacity-60' : ''}>
              <p className="text-sm font-medium text-foreground leading-tight">
                {formatDateOnly(a.fecha_acta)}{' '}
                <span className="text-muted-foreground font-normal">
                  {formatTimeOnly(a.hora_acta)}
                </span>
              </p>
              <p
                className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]"
                title={`${a.ciudad ?? ''} · ${a.lugar ?? ''}`}
              >
                {a.ciudad}
              </p>
            </div>
          );
        },
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              <Skeleton className="w-32 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-24 h-3 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'genero',
        header: 'Generó',
        size: 200,
        accessorFn: (row) => row.usuario_genero ?? '',
        cell: ({ row }) => (
          <div
            className={actaCerrada(row.original.estatus) ? 'opacity-60' : ''}
          >
            <p className="text-sm text-foreground leading-tight">
              {row.original.usuario_genero || '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {row.original.renglones}{' '}
              {row.original.renglones === 1 ? 'renglón' : 'renglones'} ·{' '}
              {row.original.fotografias}{' '}
              {row.original.fotografias === 1 ? 'fotografía' : 'fotografías'}
            </p>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              <Skeleton className="w-40 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-28 h-3 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'motivo',
        header: 'Motivo de cierre',
        size: 240,
        accessorFn: (row) => row.motivo_cierre ?? '',
        cell: ({ row }) => {
          const a = row.original;
          if (!actaCerrada(a.estatus)) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <div className="max-w-[230px] opacity-70">
              <p
                className="text-sm text-foreground truncate"
                title={a.motivo_cierre ?? ''}
              >
                {a.motivo_cierre || '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatFechaHora(a.fecha_cierre)}
              </p>
            </div>
          );
        },
        meta: {
          skeleton: (
            <Skeleton className="w-40 h-4 animate-pulse motion-reduce:animate-none" />
          ),
        },
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        size: 110,
        cell: ({ row }) => {
          const a = row.original;
          const etiqueta = etiquetaDocumento(a);
          const cargando = documentoPendiente === a.id;
          return (
            <div className="flex items-center justify-end gap-1">
              {onVerDocumento && etiqueta && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={etiqueta}
                      onClick={() => onVerDocumento(a)}
                      disabled={cargando}
                    >
                      {cargando ? (
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{etiqueta}</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-primary"
                    aria-label="Ver detalle del acta"
                    onClick={() => onVerDetalle(a)}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver detalle</TooltipContent>
              </Tooltip>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onVerDetalle, onVerDocumento, documentoPendiente],
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <>
      <div className="md:hidden space-y-3">
        <Card>
          <CardHeader className="flex-wrap gap-3 py-4">
            {headerContent}
          </CardHeader>
        </Card>
        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          emptyContent
        ) : (
          data.map((a) => (
            <MobileCard
              key={a.id}
              acta={a}
              onVerDetalle={onVerDetalle}
              onVerDocumento={onVerDocumento}
              cargando={documentoPendiente === a.id}
            />
          ))
        )}
      </div>

      <div className="hidden md:block">
        <DataGrid
          table={table}
          recordCount={data.length}
          isLoading={isLoading}
          emptyMessage={emptyContent}
          tableClassNames={{ edgeCell: 'px-5' }}
        >
          <Card>
            <CardHeader className="flex-wrap gap-3 py-5">
              {headerContent}
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
      </div>
    </>
  );
}

function MobileCard({
  acta,
  onVerDetalle,
  onVerDocumento,
  cargando,
}: {
  acta: IActaResumen;
  onVerDetalle: (acta: IActaResumen) => void;
  onVerDocumento?: (acta: IActaResumen) => void;
  cargando: boolean;
}) {
  const etiqueta = etiquetaDocumento(acta);
  return (
    <article
      className={[
        'border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800',
        actaCerrada(acta.estatus) ? 'opacity-70' : '',
      ].join(' ')}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <EstatusBadge acta={acta} />
          <p className="text-xs text-muted-foreground mt-1">
            Creada {formatFechaHora(acta.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {onVerDocumento && etiqueta && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px] gap-1.5"
              onClick={() => onVerDocumento(acta)}
              disabled={cargando}
            >
              {cargando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileText className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{acta.archivo_firmado ? 'PDF' : 'Word'}</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="min-h-[40px] gap-1.5"
            onClick={() => onVerDetalle(acta)}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            <span>Ver</span>
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Fecha del acta</p>
          <p className="text-foreground">
            {acta.fecha_acta
              ? `${formatDateOnly(acta.fecha_acta)} ${formatTimeOnly(acta.hora_acta)}`
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Generó</p>
          <p className="text-foreground">{acta.usuario_genero || '—'}</p>
        </div>
      </div>
      {actaCerrada(acta.estatus) && acta.motivo_cierre && (
        <p className="text-xs text-muted-foreground">
          Motivo: {acta.motivo_cierre}
        </p>
      )}
    </article>
  );
}
