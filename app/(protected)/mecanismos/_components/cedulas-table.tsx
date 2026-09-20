'use client';

import { useMemo } from 'react';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import type { ICedulaConsejo } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { BotonAccion } from '@/components/common/boton-accion';
import { TIPO_MECANISMO_CORTO } from '../_lib/estatus';
import {
  CedulaAccionConsejo,
  CedulaCard,
  CedulaCostos,
  CedulaDocumentos,
  type CedulaAcciones,
} from './cedula-card';
import { CasillasPorSeccion, CedulaBadge } from './mecanismo-card';

interface CedulasTableProps extends CedulaAcciones {
  consejo: string;
  tipoConsejo: 'D' | 'M';
  data: ICedulaConsejo[];
  isLoading: boolean;
  emptyContent: React.ReactNode;
  headerContent: React.ReactNode;
  /** Oficina central: botones según el estatus (proponer, aprobar, cerrar...). */
  accionesAdmin?: (c: ICedulaConsejo) => React.ReactNode;
}

const sk = (w: string) => (
  <Skeleton className={`${w} h-4 animate-pulse motion-reduce:animate-none`} />
);

/** Una fila por mecanismo del consejo con su cédula: estatus, costos, documentos y la acción que admite. */
export function CedulasTable({
  consejo,
  tipoConsejo,
  data,
  isLoading,
  emptyContent,
  headerContent,
  onVerDetalle,
  onInformar,
  onAcusar,
  onVerDocumento,
  documentoPendiente,
  accionesAdmin,
}: CedulasTableProps) {
  const columns = useMemo<ColumnDef<ICedulaConsejo>[]>(
    () => [
      {
        id: 'consejo',
        header: 'Consejo',
        size: 190,
        accessorFn: () => consejo,
        cell: () => (
          <div>
            <p
              className="text-sm text-foreground leading-tight truncate max-w-[180px]"
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
        size: 130,
        accessorFn: (c) => c.tipo,
        cell: ({ row }) => (
          <p className="text-sm font-medium text-foreground">
            {TIPO_MECANISMO_CORTO[row.original.tipo]}
          </p>
        ),
        meta: { skeleton: sk('w-24') },
        enableSorting: true,
      },
      {
        id: 'numero',
        header: 'Número',
        size: 90,
        accessorFn: (c) => c.numero,
        cell: ({ row }) => (
          <p className="text-sm font-semibold text-foreground tabular-nums">
            {row.original.numero}
          </p>
        ),
        meta: { skeleton: sk('w-10') },
        enableSorting: true,
      },
      {
        id: 'casillas',
        header: 'Secciones / Casillas',
        size: 240,
        accessorFn: (c) => c.secciones_propias ?? '',
        cell: ({ row }) => (
          <CasillasPorSeccion
            texto={row.original.casillas_propias_texto}
            conteo={`${row.original.casillas_propias} casillas`}
          />
        ),
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
      {
        id: 'estatus',
        header: 'Estatus',
        size: 150,
        accessorFn: (c) => c.cedula_estatus,
        cell: ({ row }) => (
          <div>
            <CedulaBadge m={row.original} />
            {row.original.fecha_propuesta && (
              <p className="text-xs text-muted-foreground mt-1">
                Propuesta {formatFechaHora(row.original.fecha_propuesta)}
              </p>
            )}
          </div>
        ),
        meta: { skeleton: <Skeleton className="w-20 h-5 rounded" /> },
        enableSorting: true,
      },
      {
        id: 'costos',
        header: 'Costos',
        size: 180,
        accessorFn: (c) => c.diferencia ?? 0,
        cell: ({ row }) => <CedulaCostos c={row.original} />,
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              {sk('w-24')}
              {sk('w-24')}
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'documentos',
        header: 'Documentos',
        size: 200,
        cell: ({ row }) => (
          <CedulaDocumentos
            c={row.original}
            onVerDocumento={onVerDocumento}
            documentoPendiente={documentoPendiente}
            compacto
          />
        ),
        meta: { skeleton: sk('w-28') },
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        size: accionesAdmin ? 220 : 120,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              <CedulaAccionConsejo
                c={c}
                onInformar={onInformar}
                onAcusar={onAcusar}
                size="icon"
              />
              {accionesAdmin?.(c)}
              <BotonAccion
                etiqueta="Ver detalle"
                onClick={() => onVerDetalle(c)}
              >
                <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
              </BotonAccion>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [
      consejo,
      tipoConsejo,
      onVerDetalle,
      onInformar,
      onAcusar,
      onVerDocumento,
      documentoPendiente,
      accionesAdmin,
    ],
  );

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
              <Skeleton key={i} className="h-44 w-full rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          emptyContent
        ) : (
          data.map((c) => (
            <CedulaCard
              key={c.id}
              c={c}
              consejo={consejo}
              onVerDetalle={onVerDetalle}
              onInformar={onInformar}
              onAcusar={onAcusar}
              onVerDocumento={onVerDocumento}
              documentoPendiente={documentoPendiente}
              extra={accionesAdmin?.(c)}
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
