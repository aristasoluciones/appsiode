'use client';

import { EllipsisVertical, Search, Users, X } from 'lucide-react';
import type { TMecanismoEstatus, TTipoMecanismo } from '@/types/mecanismos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChipFiltro, ConteoChip } from '@/components/common/chip-filtro';
import { ESTATUS_MECANISMO, TIPO_MECANISMO_CORTO } from '../_lib/estatus';

export type TFiltroCedula = 'con_cedula' | 'sin_cedula';

/** Estado de los filtros de la lista de mecanismos; vive en el contenedor. */
export interface IMecanismosFiltrosEstado {
  busqueda: string;
  tipos: TTipoMecanismo[];
  estatus: TMecanismoEstatus | null;
  cedula: TFiltroCedula | null;
}

export const FILTROS_VACIOS: IMecanismosFiltrosEstado = {
  busqueda: '',
  tipos: [],
  estatus: null,
  cedula: null,
};

/** Cuántos mecanismos caen en cada chip, para mostrarlos junto al filtro. */
export interface IMecanismosConteos {
  porTipo: Record<TTipoMecanismo, number>;
  informados: number;
  sinInformar: number;
  conCedula: number;
  sinCedula: number;
}

const TIPOS: TTipoMecanismo[] = ['DAT', 'CRYT_FIJO', 'CRYT_ITINERANTE'];

interface MecanismosFiltrosProps {
  filtros: IMecanismosFiltrosEstado;
  onChange: (filtros: IMecanismosFiltrosEstado) => void;
  conteos: IMecanismosConteos;
  disabled: boolean;
  /** Botón del catálogo de CAE, solo si el consejo asigna CAE. */
  onCatalogoCae?: () => void;
  /** Con la cédula abierta: solo el buscador y los chips dentro del menú ⋮. */
  compacto?: boolean;
}

/** Búsqueda y chips por tipo, estatus y cédula, con su conteo. */
export function MecanismosFiltros({
  filtros,
  onChange,
  conteos,
  disabled,
  onCatalogoCae,
  compacto = false,
}: MecanismosFiltrosProps) {
  const alternarEstatus = (v: TMecanismoEstatus) =>
    onChange({ ...filtros, estatus: filtros.estatus === v ? null : v });
  const alternarCedula = (v: TFiltroCedula) =>
    onChange({ ...filtros, cedula: filtros.cedula === v ? null : v });

  const activos =
    filtros.tipos.length + (filtros.estatus ? 1 : 0) + (filtros.cedula ? 1 : 0);

  const chipsTipo = TIPOS.map((t) => (
    <ChipFiltro
      key={t}
      activo={filtros.tipos.includes(t)}
      disabled={disabled}
      onClick={() =>
        onChange({
          ...filtros,
          tipos: filtros.tipos.includes(t)
            ? filtros.tipos.filter((x) => x !== t)
            : [...filtros.tipos, t],
        })
      }
    >
      {TIPO_MECANISMO_CORTO[t]}
      <ConteoChip>{conteos.porTipo[t]}</ConteoChip>
    </ChipFiltro>
  ));
  const chipsEstatus = (
    <>
      <ChipFiltro
        activo={filtros.estatus === 'SIN_INFORMAR'}
        disabled={disabled}
        onClick={() => alternarEstatus('SIN_INFORMAR')}
      >
        {ESTATUS_MECANISMO.SIN_INFORMAR.label}
        <ConteoChip>{conteos.sinInformar}</ConteoChip>
      </ChipFiltro>
      <ChipFiltro
        activo={filtros.estatus === 'INFORMADO'}
        disabled={disabled}
        onClick={() => alternarEstatus('INFORMADO')}
      >
        {ESTATUS_MECANISMO.INFORMADO.label}
        <ConteoChip>{conteos.informados}</ConteoChip>
      </ChipFiltro>
    </>
  );
  const chipsCedula = (
    <>
      <ChipFiltro
        activo={filtros.cedula === 'con_cedula'}
        disabled={disabled}
        onClick={() => alternarCedula('con_cedula')}
      >
        Con cédula
        <ConteoChip>{conteos.conCedula}</ConteoChip>
      </ChipFiltro>
      <ChipFiltro
        activo={filtros.cedula === 'sin_cedula'}
        disabled={disabled}
        onClick={() => alternarCedula('sin_cedula')}
      >
        Sin cédula
        <ConteoChip>{conteos.sinCedula}</ConteoChip>
      </ChipFiltro>
    </>
  );

  return (
    <div
      className={
        compacto
          ? 'flex items-center gap-2 w-full'
          : 'flex flex-col gap-3 w-full lg:flex-row lg:items-center'
      }
    >
      <div className={compacto ? 'relative flex-1' : 'relative w-full lg:w-80'}>
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          value={filtros.busqueda}
          onChange={(e) => onChange({ ...filtros, busqueda: e.target.value })}
          placeholder="Buscar por número, sección, casilla, municipio o CAE..."
          disabled={disabled}
          className="pl-9 pr-9"
          aria-label="Buscar mecanismos"
        />
        {filtros.busqueda && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => onChange({ ...filtros, busqueda: '' })}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {compacto ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative shrink-0"
              disabled={disabled}
              aria-label={
                activos
                  ? `Filtros y opciones (${activos} activos)`
                  : 'Filtros y opciones'
              }
            >
              <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
              {activos > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold leading-4 tabular-nums">
                  {activos}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 space-y-3">
            <GrupoFiltro titulo="Tipo">{chipsTipo}</GrupoFiltro>
            <GrupoFiltro titulo="Estatus">{chipsEstatus}</GrupoFiltro>
            <GrupoFiltro titulo="Cédula">{chipsCedula}</GrupoFiltro>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                disabled={activos === 0}
                onClick={() =>
                  onChange({ ...FILTROS_VACIOS, busqueda: filtros.busqueda })
                }
              >
                Limpiar filtros
              </Button>
              {onCatalogoCae && (
                <Button variant="outline" size="sm" onClick={onCatalogoCae}>
                  <Users className="h-4 w-4" aria-hidden="true" />
                  Catálogo de CAE
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filtrar por tipo, estatus y cédula"
        >
          {chipsTipo}
          <span className="w-px bg-border mx-1" aria-hidden="true" />
          {chipsEstatus}
          <span className="w-px bg-border mx-1" aria-hidden="true" />
          {chipsCedula}
        </div>
      )}

      {!compacto && onCatalogoCae && (
        <div className="lg:ml-auto">
          <Button variant="outline" onClick={onCatalogoCae} disabled={disabled}>
            <Users className="h-4 w-4" aria-hidden="true" />
            Catálogo de CAE
          </Button>
        </div>
      )}
    </div>
  );
}

/** Un grupo de chips dentro del menú ⋮, con su título. */
function GrupoFiltro({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5" role="group" aria-label={titulo}>
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
