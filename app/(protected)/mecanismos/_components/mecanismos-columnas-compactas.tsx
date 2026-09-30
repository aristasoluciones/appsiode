'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { IMecanismoLista } from '@/types/mecanismos';
import { TIPO_MECANISMO_CORTO } from '../_lib/estatus';
import {
  CaeTexto,
  CasillasPorSeccion,
  CedulaBadge,
  CostoTexto,
  InformeBadge,
} from './mecanismo-celdas';
import {
  AccionesCelda,
  skBadge,
  skDos,
  type ColumnasParams,
} from './mecanismos-columnas';

/**
 * Columnas para cuando la cédula está abierta a la derecha: menos ancho, sin
 * scroll horizontal y con lo esencial a la vista (mecanismo, secciones y
 * casillas, CAE, estatus con costo y acciones). El consejo ya está en el
 * encabezado de la página; el resto queda en el detalle.
 */
export function crearColumnasMecanismosCompactas({
  modo,
  ...acciones
}: ColumnasParams): ColumnDef<IMecanismoLista>[] {
  return [
    {
      id: 'tipo',
      header: 'Mecanismo',
      size: 110,
      accessorFn: (m) => m.tipo,
      cell: ({ row }) => (
        <div className={row.original.activo ? '' : 'opacity-60'}>
          <p className="text-sm font-medium text-foreground leading-tight whitespace-nowrap">
            {TIPO_MECANISMO_CORTO[row.original.tipo]}{' '}
            <span className="font-semibold tabular-nums">
              {row.original.numero}
            </span>
          </p>
          <div className="mt-1">
            <CedulaBadge m={row.original} />
          </div>
        </div>
      ),
      meta: { skeleton: skDos },
      enableSorting: true,
    },
    {
      id: 'numero',
      accessorFn: (m) => m.numero,
      enableHiding: true,
    },
    {
      id: 'casillas',
      header: 'Secciones / Casillas',
      size: 200,
      accessorFn: (m) => m.secciones_propias ?? '',
      cell: ({ row }) => (
        <CasillasPorSeccion
          texto={row.original.casillas_propias_texto}
          conteo={`${row.original.casillas_propias} casillas`}
        />
      ),
      meta: { skeleton: skDos },
      enableSorting: true,
    },
    {
      id: 'cae',
      header: 'CAE',
      size: 150,
      accessorFn: (m) => m.cae_nombre ?? '',
      cell: ({ row }) => <CaeTexto m={row.original} />,
      meta: { skeleton: skDos },
      enableSorting: true,
    },
    {
      id: 'estatus',
      header: 'Estatus',
      size: 130,
      accessorFn: (m) => (m.estatus === 'INFORMADO' ? 1 : 0),
      cell: ({ row }) => (
        <div className="space-y-1">
          <InformeBadge m={row.original} />
          <CostoTexto m={row.original} modo={modo} />
        </div>
      ),
      meta: { skeleton: skBadge },
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      size: 130,
      cell: ({ row }) => <AccionesCelda m={row.original} {...acciones} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
