'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, FilePen, FileText, Pencil, Upload } from 'lucide-react';
import type { IMecanismoLista } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BotonAccion } from '@/components/common/boton-accion';
import { TIPO_MECANISMO_CORTO } from '../_lib/estatus';
import type { MecanismoAcciones } from './mecanismo-card';
import {
  CaeTexto,
  CasillasPorSeccion,
  CedulaBadge,
  CostoTexto,
  InformeBadge,
  ObservacionesTexto,
} from './mecanismo-celdas';

const sk = (w: string) => (
  <Skeleton className={`${w} h-4 animate-pulse motion-reduce:animate-none`} />
);

export const skDos = (
  <div className="space-y-1.5">
    {sk('w-36')}
    {sk('w-24')}
  </div>
);

export const skBadge = <Skeleton className="w-20 h-5 rounded" />;

/** Botones de la columna de acciones; la cédula cambia según quién mira y si ya existe. */
export function AccionesCelda({
  m,
  onVerDetalle,
  onInformar,
  onEditar,
  onVerCedula,
  onCargarCedula,
}: { m: IMecanismoLista } & MecanismoAcciones) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onInformar && m.estatus !== 'INFORMADO' && (
        <BotonAccion
          etiqueta={
            m.tiene_cedula
              ? 'Informar mecanismo'
              : 'Sin cédula: se informa cuando oficina central la cargue'
          }
          onClick={() => onInformar(m)}
          disabled={!m.tiene_cedula}
        >
          <FilePen className="h-4 w-4" aria-hidden="true" />
        </BotonAccion>
      )}
      {onEditar && (
        <BotonAccion
          etiqueta="Editar mecanismo"
          onClick={() => onEditar(m)}
          disabled={!m.activo}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </BotonAccion>
      )}
      {!m.tiene_cedula && onCargarCedula ? (
        <BotonAccion etiqueta="Cargar cédula" onClick={() => onCargarCedula(m)}>
          <Upload className="h-4 w-4" aria-hidden="true" />
        </BotonAccion>
      ) : (
        (onVerCedula || onCargarCedula) && (
          <BotonAccion
            etiqueta={m.tiene_cedula ? 'Ver cédula' : 'Sin cédula'}
            onClick={() => onVerCedula?.(m)}
            disabled={!m.tiene_cedula || !onVerCedula}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
          </BotonAccion>
        )
      )}
      <BotonAccion etiqueta="Ver detalle" onClick={() => onVerDetalle(m)}>
        <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
      </BotonAccion>
    </div>
  );
}

export interface ColumnasParams extends MecanismoAcciones {
  modo: 'consejo' | 'admin';
  consejo: string;
  tipoConsejo: 'D' | 'M';
}

/**
 * Columnas de la tabla de mecanismos. El consejo ve sus casillas y su
 * informe; oficina central además los consejos vinculados.
 */
export function crearColumnasMecanismos({
  modo,
  consejo,
  tipoConsejo,
  ...acciones
}: ColumnasParams): ColumnDef<IMecanismoLista>[] {
  const inactivo = (m: IMecanismoLista) => (m.activo ? '' : 'opacity-60');

  const columnas: ColumnDef<IMecanismoLista>[] = [
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
      meta: { skeleton: skDos },
      enableSorting: false,
    },
    {
      id: 'tipo',
      header: 'Tipo',
      size: 150,
      accessorFn: (m) => m.tipo,
      cell: ({ row }) => (
        <p
          className={`text-sm font-medium text-foreground ${inactivo(row.original)}`}
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
          className={`text-sm font-semibold text-foreground tabular-nums ${inactivo(row.original)}`}
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
      meta: { skeleton: skDos },
      enableSorting: true,
    },
  ];

  if (modo === 'admin') {
    columnas.push({
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
      meta: { skeleton: skDos },
      enableSorting: true,
    });
  }

  columnas.push(
    {
      id: 'cae',
      header: 'CAE',
      size: 220,
      accessorFn: (m) => m.cae_nombre ?? '',
      cell: ({ row }) => <CaeTexto m={row.original} />,
      meta: { skeleton: skDos },
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
      id: 'observaciones',
      header: 'Observaciones',
      size: 190,
      accessorFn: (m) => m.total_observaciones,
      cell: ({ row }) => <ObservacionesTexto m={row.original} />,
      meta: { skeleton: skDos },
      enableSorting: true,
    },
    {
      id: 'estatus',
      header: 'Estatus',
      size: 150,
      accessorFn: (m) => (m.estatus === 'INFORMADO' ? 1 : 0),
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
      meta: { skeleton: skBadge },
      enableSorting: true,
    },
    {
      id: 'cedula',
      header: 'Cédula',
      size: 130,
      accessorFn: (m) => (m.tiene_cedula ? 1 : 0),
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
      meta: { skeleton: skBadge },
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      size: 160,
      cell: ({ row }) => <AccionesCelda m={row.original} {...acciones} />,
      enableSorting: false,
      enableHiding: false,
    },
  );

  return columnas;
}
