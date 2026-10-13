'use client';

import { useMemo } from 'react';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { IMecanismoLista } from '@/types/mecanismos';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MecanismoCard, type MecanismoAcciones } from './mecanismo-card';
import { crearColumnasMecanismos } from './mecanismos-columnas';
import { crearColumnasMecanismosCompactas } from './mecanismos-columnas-compactas';

/** Alto de la lista junto a la cédula, el mismo del panel (pantallas anchas). */
const ALTO_COMPACTO =
  'flex flex-col xl:h-[calc(100vh-var(--header-height,70px)-2rem)]';

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
  /** Con la cédula abierta a la derecha: columnas esenciales y sin scroll horizontal. */
  compacto?: boolean;
  /** Mecanismo cuya cédula está a la vista; su fila se resalta. */
  seleccionadoId?: number | null;
  /** Clic en una fila (modo compacto): cambia la cédula a la vista. */
  onSeleccionar?: (m: IMecanismoLista) => void;
}

/** Tabla de mecanismos en escritorio y tarjetas en móvil, con las mismas acciones. */
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
  onVerCedula,
  onCargarCedula,
  onRevocarInforme,
  compacto = false,
  seleccionadoId = null,
  onSeleccionar,
}: MecanismosTableProps) {
  const columns = useMemo(
    () =>
      (compacto ? crearColumnasMecanismosCompactas : crearColumnasMecanismos)({
        modo,
        consejo,
        tipoConsejo,
        onVerDetalle,
        onInformar,
        onEditar,
        onVerCedula,
        onCargarCedula,
        onRevocarInforme,
      }),
    [
      compacto,
      modo,
      consejo,
      tipoConsejo,
      onVerDetalle,
      onInformar,
      onEditar,
      onVerCedula,
      onCargarCedula,
      onRevocarInforme,
    ],
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (m) => String(m.id),
    enableRowSelection: compacto,
    state: {
      rowSelection: seleccionadoId ? { [String(seleccionadoId)]: true } : {},
    },
    initialState: {
      pagination: { pageSize: 20 },
      sorting: [{ id: 'mecanismo', desc: false }],
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
              onVerCedula={onVerCedula}
              onCargarCedula={onCargarCedula}
              onRevocarInforme={onRevocarInforme}
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
          onRowClick={compacto ? onSeleccionar : undefined}
          tableLayout={{ headerSticky: compacto }}
          tableClassNames={{
            edgeCell: compacto ? 'px-3' : 'px-5',
            bodyRow: 'data-[state=selected]:bg-primary/10',
          }}
        >
          {/* Junto a la cédula la tarjeta mide lo mismo que el panel: encabezados fijos y solo el cuerpo se desplaza. */}
          <Card className={compacto ? ALTO_COMPACTO : undefined}>
            <CardHeader className="flex-wrap gap-3 py-5 shrink-0">
              {headerContent}
            </CardHeader>
            <CardTable className={compacto ? 'flex-1 min-h-0' : undefined}>
              <ScrollArea
                className={compacto ? 'h-full' : undefined}
                viewportClassName={compacto ? 'h-full' : undefined}
              >
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
            <CardFooter className="shrink-0">
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
