'use client';

import { useMemo } from 'react';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Eye, FilePen, Pencil } from 'lucide-react';
import type { IMecanismoLista } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
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
import { TIPO_MECANISMO_CORTO } from '../_lib/estatus';
import {
  CaeTexto,
  CasillasPorSeccion,
  CedulaBadge,
  CostoTexto,
  InformeBadge,
  MecanismoCard,
  type MecanismoAcciones,
} from './mecanismo-card';

interface MecanismosTableProps extends MecanismoAcciones {
  /** Consejo: sus casillas y su informe. Oficina central: además los consejos que el mecanismo vincula. */
  modo: 'consejo' | 'admin';
  /** Consejo que se está viendo; todo se lee desde él. */
  consejo: string;
  tipoConsejo: 'D' | 'M';
  data: IMecanismoLista[];
  isLoading: boolean;
  emptyContent: React.ReactNode;
  headerContent: React.ReactNode;
}

const sk = (w: string) => (
  <Skeleton className={`${w} h-4 animate-pulse motion-reduce:animate-none`} />
);

function Accion({
  etiqueta,
  onClick,
  disabled,
  children,
}: {
  etiqueta: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={etiqueta}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{etiqueta}</TooltipContent>
    </Tooltip>
  );
}

export function MecanismosTable({
  modo,
  consejo,
  tipoConsejo,
  data,
  isLoading,
  emptyContent,
  headerContent,
  onVerDetalle,
  onInformar,
  onEditar,
}: MecanismosTableProps) {
  const columns = useMemo<ColumnDef<IMecanismoLista>[]>(() => {
    const base: ColumnDef<IMecanismoLista>[] = [
      {
        id: 'consejo',
        header: 'Consejo',
        size: 200,
        accessorFn: () => consejo,
        cell: () => (
          <div>
            <p
              className="text-sm text-foreground leading-tight truncate max-w-[190px]"
              title={consejo}
            >
              {consejo}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tipoConsejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal'}
            </p>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              {sk('w-36')}
              {sk('w-24')}
            </div>
          ),
        },
        enableSorting: false,
      },
      {
        id: 'tipo',
        header: 'Tipo',
        size: 150,
        accessorFn: (m) => m.tipo,
        cell: ({ row }) => (
          <p
            className={[
              'text-sm font-medium text-foreground',
              row.original.activo ? '' : 'opacity-60',
            ].join(' ')}
          >
            {TIPO_MECANISMO_CORTO[row.original.tipo]}
          </p>
        ),
        meta: { skeleton: sk('w-24') },
        enableSorting: true,
      },
      {
        id: 'numero',
        header: 'Número',
        size: 100,
        accessorFn: (m) => m.numero,
        cell: ({ row }) => (
          <p
            className={[
              'text-sm font-semibold text-foreground tabular-nums',
              row.original.activo ? '' : 'opacity-60',
            ].join(' ')}
          >
            {row.original.numero}
          </p>
        ),
        meta: { skeleton: sk('w-10') },
        enableSorting: true,
      },
      {
        id: 'casillas',
        header: 'Secciones / Casillas',
        size: 260,
        accessorFn: (m) => m.secciones_propias ?? '',
        cell: ({ row }) => {
          const m = row.original;
          const conteo =
            `${m.casillas_propias} ${m.casillas_propias === 1 ? 'casilla' : 'casillas'}` +
            (modo === 'admin' && m.casillas_propias !== m.total_casillas
              ? ` de ${m.total_casillas} en la ruta`
              : '');
          return (
            <CasillasPorSeccion
              texto={m.casillas_propias_texto}
              conteo={conteo}
            />
          );
        },
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              {sk('w-16')}
              {sk('w-32')}
            </div>
          ),
        },
        enableSorting: true,
      },
    ];

    if (modo === 'admin') {
      base.push({
        id: 'consejos',
        header: 'Consejos vinculados',
        size: 200,
        accessorFn: (m) => m.total_consejos,
        cell: ({ row }) => (
          <div>
            <p className="text-sm text-foreground leading-tight">
              {row.original.total_consejos}{' '}
              {row.original.total_consejos === 1 ? 'consejo' : 'consejos'} ·{' '}
              {row.original.consejos_texto}
            </p>
            <p
              className="text-xs text-muted-foreground mt-0.5 truncate max-w-[190px]"
              title={row.original.municipios ?? ''}
            >
              {row.original.municipios || '—'}
            </p>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              {sk('w-36')}
              {sk('w-24')}
            </div>
          ),
        },
        enableSorting: true,
      });
    }

    base.push(
      {
        id: 'cae',
        header: 'CAE',
        size: 220,
        accessorFn: (m) => m.cae_nombre ?? '',
        cell: ({ row }) => <CaeTexto m={row.original} />,
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              {sk('w-40')}
              {sk('w-20')}
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'costo',
        header: 'Costo',
        size: modo === 'admin' ? 170 : 130,
        accessorFn: (m) => m.costo_estimado ?? -1,
        cell: ({ row }) => <CostoTexto m={row.original} modo={modo} />,
        meta: { skeleton: sk('w-24') },
        enableSorting: true,
      },
      {
        id: 'informe',
        header: 'Informe',
        size: 150,
        accessorFn: (m) => (m.informado ? 1 : 0),
        cell: ({ row }) => (
          <div>
            <InformeBadge m={row.original} />
            {row.original.fecha_informe && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatFechaHora(row.original.fecha_informe)}
              </p>
            )}
          </div>
        ),
        meta: { skeleton: <Skeleton className="w-20 h-5 rounded" /> },
        enableSorting: true,
      },
      {
        id: 'cedula',
        header: 'Cédula',
        size: 120,
        accessorFn: (m) => m.cedula_estatus,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <CedulaBadge m={row.original} />
            {!row.original.activo && (
              <Badge variant="destructive" appearance="light" size="sm">
                Inactivo
              </Badge>
            )}
          </div>
        ),
        meta: { skeleton: <Skeleton className="w-20 h-5 rounded" /> },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        size: 120,
        cell: ({ row }) => {
          const m = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {onInformar && (
                <Accion
                  etiqueta="Informar mecanismo"
                  onClick={() => onInformar(m)}
                >
                  <FilePen className="h-4 w-4" aria-hidden="true" />
                </Accion>
              )}
              {onEditar && (
                <Accion
                  etiqueta="Editar mecanismo"
                  onClick={() => onEditar(m)}
                  disabled={!m.activo}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Accion>
              )}
              <Accion etiqueta="Ver detalle" onClick={() => onVerDetalle(m)}>
                <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
              </Accion>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    );

    return base;
  }, [modo, consejo, tipoConsejo, onVerDetalle, onInformar, onEditar]);

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
      sorting: [
        { id: 'tipo', desc: false },
        { id: 'numero', desc: false },
      ],
    },
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
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          emptyContent
        ) : (
          data.map((m) => (
            <MecanismoCard
              key={m.id}
              m={m}
              consejo={consejo}
              modo={modo}
              onVerDetalle={onVerDetalle}
              onInformar={onInformar}
              onEditar={onEditar}
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
