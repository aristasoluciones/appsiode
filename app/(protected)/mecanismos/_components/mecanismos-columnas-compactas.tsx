'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, FilePen, Pencil, Undo2, Upload } from 'lucide-react';
import type { IMecanismoLista } from '@/types/mecanismos';
import { Button } from '@/components/ui/button';
import { puedeInformar, TIPO_MECANISMO_CORTO } from '../_lib/estatus';
import type { MecanismoAcciones } from './mecanismo-card';
import {
  CaeTexto,
  CasillasPorSeccion,
  InformeBadge,
  MontoCosto,
} from './mecanismo-celdas';
import { skDos, type ColumnasParams } from './mecanismos-columnas';

/** Una pieza de la ficha con su etiqueta arriba: «Costo INE», «CAE». */
function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[0.6875rem] text-muted-foreground leading-tight">
        {etiqueta}
      </p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

/**
 * Ficha del mecanismo para la lista junto a la cédula: en lugar de columnas
 * apretadas, todo en líneas dentro de un solo renglón. Arriba número, tipo y
 * estatus; luego secciones y casillas; abajo costos y CAE.
 */
function FichaMecanismo({ m }: { m: IMecanismoLista }) {
  return (
    <div className={`space-y-2 py-1 ${m.activo ? '' : 'opacity-60'}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-sm text-foreground whitespace-nowrap">
          <span className="text-xs text-muted-foreground">No.</span>{' '}
          <span className="font-semibold tabular-nums">{m.numero}</span>
        </p>
        <span className="text-xs text-muted-foreground">
          {TIPO_MECANISMO_CORTO[m.tipo]}
        </span>
        <span className="ml-auto">
          <InformeBadge m={m} />
        </span>
      </div>

      <CasillasPorSeccion
        texto={m.casillas_propias_texto}
        conteo={`${m.casillas_propias} casillas`}
      />

      <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-4 gap-y-1 items-start">
        <Dato etiqueta="Costo INE">
          <MontoCosto valor={m.costo_ine} origen="ine" />
        </Dato>
        <Dato etiqueta="Costo consejo">
          <MontoCosto valor={m.costo_estimado} origen="consejo" />
        </Dato>
        <Dato etiqueta="CAE">
          <CaeTexto m={m} />
        </Dato>
      </div>
    </div>
  );
}

/** Botón pequeño de la barra de la ficha; no propaga el clic para no cambiar el PDF a la vista. */
function BotonFicha({
  onClick,
  icono,
  children,
  principal,
}: {
  onClick: () => void;
  icono: React.ReactNode;
  children: React.ReactNode;
  principal?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={principal ? 'primary' : 'outline'}
      size="sm"
      className="h-7 px-2 gap-1 text-xs"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {icono}
      {children}
    </Button>
  );
}

/**
 * Acciones dentro de la ficha, con texto. Sin «Ver cédula»: aquí el clic en la
 * ficha ya la muestra; solo queda «Cargar cédula» para oficina central cuando falta.
 */
function AccionesFicha({
  m,
  onVerDetalle,
  onInformar,
  onEditar,
  onCargarCedula,
  onRevocarInforme,
}: { m: IMecanismoLista } & MecanismoAcciones) {
  const icono = 'h-3.5 w-3.5';
  return (
    <div className="flex flex-wrap justify-end gap-1.5 pt-2 border-t border-border/60">
      {onInformar && puedeInformar(m) && (
        <BotonFicha
          principal
          onClick={() => onInformar(m)}
          icono={<FilePen className={icono} aria-hidden="true" />}
        >
          Revisar
        </BotonFicha>
      )}
      {onRevocarInforme && m.estatus === 'INFORMADO' && (
        <BotonFicha
          onClick={() => onRevocarInforme(m)}
          icono={<Undo2 className={icono} aria-hidden="true" />}
        >
          Revocar revisión
        </BotonFicha>
      )}
      {onEditar && m.activo && (
        <BotonFicha
          onClick={() => onEditar(m)}
          icono={<Pencil className={icono} aria-hidden="true" />}
        >
          Editar
        </BotonFicha>
      )}
      {onCargarCedula && !m.tiene_cedula && (
        <BotonFicha
          onClick={() => onCargarCedula(m)}
          icono={<Upload className={icono} aria-hidden="true" />}
        >
          Cargar cédula
        </BotonFicha>
      )}
      <BotonFicha
        onClick={() => onVerDetalle(m)}
        icono={<Eye className={icono} aria-hidden="true" />}
      >
        Detalle
      </BotonFicha>
    </div>
  );
}

/**
 * Columna única para cuando la cédula está abierta a la derecha: una ficha por
 * mecanismo con su información y sus acciones, sin scroll horizontal. El
 * consejo ya está en el encabezado de la página; el resto queda en el detalle.
 */
export function crearColumnasMecanismosCompactas(
  params: ColumnasParams,
): ColumnDef<IMecanismoLista>[] {
  return [
    {
      // Mismo id que en la tabla completa: conserva el orden por tipo y número.
      id: 'mecanismo',
      header: 'Mecanismos',
      accessorFn: (m) => `${m.tipo}-${String(m.numero).padStart(3, '0')}`,
      cell: ({ row }) => (
        <div className="space-y-2">
          <FichaMecanismo m={row.original} />
          <AccionesFicha m={row.original} {...params} />
        </div>
      ),
      meta: { skeleton: skDos },
      enableSorting: true,
    },
  ];
}
