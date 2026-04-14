'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  ESTADOS_CONFIG,
  type IConsejoIndicador,
  type TTipoConsejo,
} from './indicadores-data';

// ─── Barra de distribución ────────────────────────────────────────────────────

function DistribBar({ row }: { row: IConsejoIndicador }) {
  const { total, programadas, conDemora, enProceso, concluidas } = row;
  if (total === 0) return null;
  return (
    <div
      className="h-1 mt-1 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex"
      aria-hidden="true"
    >
      {programadas > 0 && (
        <div style={{ width: `${(programadas / total) * 100}%` }} className="bg-info" />
      )}
      {conDemora > 0 && (
        <div style={{ width: `${(conDemora / total) * 100}%` }} className="bg-warning" />
      )}
      {enProceso > 0 && (
        <div style={{ width: `${(enProceso / total) * 100}%` }} className="bg-yellow-400" />
      )}
      {concluidas > 0 && (
        <div style={{ width: `${(concluidas / total) * 100}%` }} className="bg-success" />
      )}
    </div>
  );
}

// ─── Celda de conteo con badge de color ───────────────────────────────────────

function ConteoCell({
  value,
  colorBg,
  colorText,
  label,
}: {
  value: number;
  colorBg: string;
  colorText: string;
  label: string;
}) {
  if (value === 0) {
    return (
      <span
        className="text-gray-300 dark:text-gray-600 select-none block text-center text-base"
        aria-label={`${label}: sin sesiones`}
      >
        —
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded text-sm font-semibold ${colorBg} ${colorText}`}
      aria-label={`${label}: ${value}`}
    >
      {value}
    </span>
  );
}

// ─── Tarjeta de fila para móvil ───────────────────────────────────────────────

function MobileCard({
  row,
  tipoCode,
}: {
  row: IConsejoIndicador;
  tipoCode: string;
}) {
  const estados: Array<{ label: string; value: number; estado: keyof typeof ESTADOS_CONFIG }> = [
    { label: 'Programadas', value: row.programadas, estado: 'programada' },
    { label: 'Con Demora', value: row.conDemora, estado: 'con_demora' },
    { label: 'En Proceso', value: row.enProceso, estado: 'en_proceso' },
    { label: 'Concluidas', value: row.concluidas, estado: 'concluida' },
  ];

  return (
    <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
      <header>
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Clave {row.clave}
        </p>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
          {row.nombre}
        </h3>
      </header>

      <div className="grid grid-cols-2 gap-2" role="list" aria-label="Sesiones por estado">
        {estados.map(({ label, value, estado }) => {
          const cfg = ESTADOS_CONFIG[estado];
          return (
            <div
              key={estado}
              role="listitem"
              className={`flex flex-col items-center justify-center rounded-md p-3 ${cfg.colorBg}`}
            >
              <span className={`text-2xl font-bold ${cfg.colorText}`} aria-label={`${value} sesiones`}>
                {value === 0 ? '—' : value}
              </span>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5">
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <footer className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Total: </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {row.total}
          </span>
          <DistribBar row={row} />
        </div>
        <Link href={`/sesiones/${tipoCode}/${row.clave}`}>
          <Button variant="outline" className="min-h-[44px] gap-1.5">
            <span>Ver detalle</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </footer>
    </article>
  );
}

// ─── Filas skeleton para móvil ────────────────────────────────────────────────

function MobileSkeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 space-y-3"
        >
          <div className="space-y-1.5">
            <Skeleton className="w-20 h-3 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="w-44 h-5 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }, (_, j) => (
              <Skeleton
                key={j}
                className="h-16 rounded-md animate-pulse motion-reduce:animate-none"
              />
            ))}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
            <Skeleton className="w-16 h-4 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="w-28 h-11 rounded-md animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface IndicadoresTableProps {
  data: IConsejoIndicador[];
  isLoading: boolean;
  tipoConsejo: TTipoConsejo;
  emptyContent: React.ReactNode;
  headerContent: React.ReactNode;
}

const TIPO_CODE: Record<TTipoConsejo, string> = {
  distrital: 'd',
  municipal: 'm',
};

export function IndicadoresTable({
  data,
  isLoading,
  tipoConsejo,
  emptyContent,
  headerContent,
}: IndicadoresTableProps) {
  const tipoCode = TIPO_CODE[tipoConsejo];

  const columns = useMemo<ColumnDef<IConsejoIndicador>[]>(
    () => [
      {
        accessorKey: 'clave',
        header: 'Clave',
        size: 72,
        cell: ({ row }) => (
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400 block text-center">
            {row.original.clave}
          </span>
        ),
        meta: {
          skeleton: (
            <Skeleton className="w-10 h-4 mx-auto animate-pulse motion-reduce:animate-none" />
          ),
        },
        enableSorting: true,
      },
      {
        accessorKey: 'nombre',
        header: 'Consejo',
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {row.original.nombre}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {tipoConsejo === 'distrital' ? 'Consejo Distrital' : 'Consejo Municipal'}{' '}
              {row.original.clave}
            </p>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="space-y-1.5">
              <Skeleton className="w-44 h-4 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="w-24 h-3 animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        accessorKey: 'programadas',
        header: 'Programadas',
        size: 110,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <ConteoCell
              value={row.original.programadas}
              colorBg={ESTADOS_CONFIG.programada.colorBg}
              colorText={ESTADOS_CONFIG.programada.colorText}
              label="Programadas"
            />
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex justify-center">
              <Skeleton className="w-8 h-6 rounded animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        accessorKey: 'conDemora',
        header: 'Con Demora',
        size: 110,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <ConteoCell
              value={row.original.conDemora}
              colorBg={ESTADOS_CONFIG.con_demora.colorBg}
              colorText={ESTADOS_CONFIG.con_demora.colorText}
              label="Con Demora"
            />
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex justify-center">
              <Skeleton className="w-8 h-6 rounded animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        accessorKey: 'enProceso',
        header: 'En Proceso',
        size: 100,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <ConteoCell
              value={row.original.enProceso}
              colorBg={ESTADOS_CONFIG.en_proceso.colorBg}
              colorText={ESTADOS_CONFIG.en_proceso.colorText}
              label="En Proceso"
            />
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex justify-center">
              <Skeleton className="w-8 h-6 rounded animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        accessorKey: 'concluidas',
        header: 'Concluidas',
        size: 100,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <ConteoCell
              value={row.original.concluidas}
              colorBg={ESTADOS_CONFIG.concluida.colorBg}
              colorText={ESTADOS_CONFIG.concluida.colorText}
              label="Concluidas"
            />
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex justify-center">
              <Skeleton className="w-8 h-6 rounded animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        accessorKey: 'total',
        header: 'Total',
        size: 90,
        cell: ({ row }) => (
          <div className="text-center">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {row.original.total}
            </span>
            <DistribBar row={row.original} />
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex justify-center">
              <Skeleton className="w-8 h-6 rounded animate-pulse motion-reduce:animate-none" />
            </div>
          ),
        },
        enableSorting: true,
      },
      {
        id: 'actions',
        header: '',
        size: 130,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Link href={`/sesiones/${tipoCode}/${row.original.clave}`}>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] gap-1.5 text-primary hover:text-primary/80"
              >
                <span>Ver detalle</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [tipoCode, tipoConsejo],
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
      {/* ── Móvil (< md) ── */}
      <div className="md:hidden space-y-3">
        <Card>
          <CardHeader className="flex-wrap gap-3 py-4">{headerContent}</CardHeader>
        </Card>
        {isLoading ? (
          <MobileSkeletons />
        ) : data.length === 0 ? (
          emptyContent
        ) : (
          data.map((row) => (
            <MobileCard key={row.clave} row={row} tipoCode={tipoCode} />
          ))
        )}
      </div>

      {/* ── Escritorio (md+) ── */}
      <div className="hidden md:block">
        <DataGrid
          table={table}
          recordCount={data.length}
          isLoading={isLoading}
          emptyMessage={emptyContent}
          tableClassNames={{ edgeCell: 'px-5' }}
        >
          <Card>
            <CardHeader className="flex-wrap gap-3 py-5">{headerContent}</CardHeader>
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
      </div>
    </>
  );
}
