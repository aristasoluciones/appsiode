'use client';

import { Search, Users, X } from 'lucide-react';
import type { TMecanismoEstatus, TTipoMecanismo } from '@/types/mecanismos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChipFiltro } from '@/components/common/chip-filtro';
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
}

/** Búsqueda y chips por tipo, estatus y cédula, con su conteo. */
export function MecanismosFiltros({
  filtros,
  onChange,
  conteos,
  disabled,
  onCatalogoCae,
}: MecanismosFiltrosProps) {
  const alternarEstatus = (v: TMecanismoEstatus) =>
    onChange({ ...filtros, estatus: filtros.estatus === v ? null : v });
  const alternarCedula = (v: TFiltroCedula) =>
    onChange({ ...filtros, cedula: filtros.cedula === v ? null : v });

  return (
    <div className="flex flex-col gap-3 w-full lg:flex-row lg:items-center">
      <div className="relative w-full lg:w-80">
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

      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="Filtrar por tipo, estatus y cédula"
      >
        {TIPOS.map((t) => (
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
            <span className="tabular-nums font-semibold">
              {conteos.porTipo[t]}
            </span>
          </ChipFiltro>
        ))}
        <span className="w-px bg-border mx-1" aria-hidden="true" />
        <ChipFiltro
          activo={filtros.estatus === 'SIN_INFORMAR'}
          disabled={disabled}
          onClick={() => alternarEstatus('SIN_INFORMAR')}
        >
          {ESTATUS_MECANISMO.SIN_INFORMAR.label}
          <span className="tabular-nums font-semibold">
            {conteos.sinInformar}
          </span>
        </ChipFiltro>
        <ChipFiltro
          activo={filtros.estatus === 'INFORMADO'}
          disabled={disabled}
          onClick={() => alternarEstatus('INFORMADO')}
        >
          {ESTATUS_MECANISMO.INFORMADO.label}
          <span className="tabular-nums font-semibold">
            {conteos.informados}
          </span>
        </ChipFiltro>
        <span className="w-px bg-border mx-1" aria-hidden="true" />
        <ChipFiltro
          activo={filtros.cedula === 'con_cedula'}
          disabled={disabled}
          onClick={() => alternarCedula('con_cedula')}
        >
          Con cédula
          <span className="tabular-nums font-semibold">
            {conteos.conCedula}
          </span>
        </ChipFiltro>
        <ChipFiltro
          activo={filtros.cedula === 'sin_cedula'}
          disabled={disabled}
          onClick={() => alternarCedula('sin_cedula')}
        >
          Sin cédula
          <span className="tabular-nums font-semibold">
            {conteos.sinCedula}
          </span>
        </ChipFiltro>
      </div>

      {onCatalogoCae && (
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
