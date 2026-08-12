'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { TTipoConsejo } from '@/hooks/use-proceso';
import { useAuth } from '@/providers/auth-provider';
import { useAperturasLista } from '../_hooks/use-aperturas';
import {
  useCatalogosAperturas,
} from '../_hooks/use-external';
import { AperturasTable } from './apertura-table';
import {
  EmptyStateErrorAperturas,
  EmptyStateSinAperturas,
  EmptyStateBusquedaApertura,
} from './empty-state';
import type { TTipoEleccion } from '@/types/aperturas-bodegas';

// ─── Pills por tipoConsejo / elección ─────────────────────────────────────────

interface TipoEleccionPillProps {
  options: { value: TTipoEleccion; label: string }[];
  value: TTipoEleccion | null;
  onChange: (v: TTipoEleccion) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const PILL_POR_TIPO: Record<TTipoConsejo, TTipoEleccion[]> = {
  distrital: ['DIPU', 'GOB'],
  municipal: ['AYUN'],
};

const LABEL_POR_ELECCION: Record<TTipoEleccion, string> = {
  DIPU: 'Diputaciones',
  GOB: 'Gubernatura',
  AYUN: 'Ayuntamientos',
};

export function TipoEleccionPills({
  options,
  value,
  onChange,
  disabled,
  isLoading,
}: TipoEleccionPillProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2" aria-hidden="true">
        <Skeleton className="h-8.5 w-28 rounded-md" />
        <Skeleton className="h-8.5 w-28 rounded-md" />
      </div>
    );
  }

  if (options.length === 0) return null;

  return (
    <div
      role="radiogroup"
      aria-label="Tipo de elección"
      className="flex flex-wrap gap-2"
    >
      {options.map((op) => {
        const isActive = value === op.value;
        return (
          <button
            key={op.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(op.value)}
            disabled={disabled}
            className={[
              'inline-flex items-center gap-2 h-8.5 px-3 rounded-md border text-[0.8125rem] font-medium',
              'transition-colors duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isActive
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-input text-foreground hover:bg-accent',
            ].join(' ')}
          >
            <span>{op.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Search input ─────────────────────────────────────────────────────────────

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  resultCount?: number;
}

function AperturaSearchInput({
  value,
  onChange,
  disabled,
  resultCount,
}: SearchInputProps) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por motivo..."
        disabled={disabled}
        className="pl-9 pr-9"
        aria-label="Buscar aperturas"
      />
      {value && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
      {resultCount !== undefined && (
        <span className="sr-only" aria-live="polite">
          {resultCount} resultados
        </span>
      )}
    </div>
  );
}

// ─── Container principal ──────────────────────────────────────────────────────

const TIPO_CHAR: Record<TTipoConsejo, 'D' | 'M'> = {
  distrital: 'D',
  municipal: 'M',
};

export function AperturasContainer() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();

  const canCrear = hasPermission('bodegas.aperturas.registrar');

  // El tipoConsejo del JWT determina las pills disponibles.
  // Capturista → su tipoConsejo. Admin → permite ambos si están en el proceso.
  const tipoConsejoUser: TTipoConsejo | null = useMemo(() => {
    const t = user?.tipoConsejo;
    if (t === 'D') return 'distrital';
    if (t === 'M') return 'municipal';
    return null;
  }, [user?.tipoConsejo]);

  const idConsejo = user?.idConsejo ? parseInt(user.idConsejo, 10) : null;

  const { data: catalogos } = useCatalogosAperturas(!!tipoConsejoUser);

  // Filtra elecciones del catálogo que coincidan con el tipoConsejo del usuario.
  // Para tipoConsejo=D nunca se lista AYUN (solo DIPU/GOB).
  // Para tipoConsejo=M solo se lista AYUN.
  const eleccionesDisponibles = useMemo(() => {
    if (!catalogos?.elecciones?.length || !tipoConsejoUser) return [];
    const permitidas = PILL_POR_TIPO[tipoConsejoUser];
    return catalogos.elecciones
      .filter((e) => permitidas.includes(e.clave))
      .map((e) => ({ value: e.clave, label: LABEL_POR_ELECCION[e.clave] }));
  }, [catalogos, tipoConsejoUser]);

  // Estado local
  const [tipoEleccion, setTipoEleccion] = useState<TTipoEleccion | null>(null);
  const [busqueda, setBusqueda] = useState('');

  // Auto-selecciona la primera elección válida al cargar.
  useEffect(() => {
    if (tipoEleccion === null && eleccionesDisponibles.length > 0) {
      setTipoEleccion(eleccionesDisponibles[0].value);
    }
  }, [eleccionesDisponibles, tipoEleccion]);

  const tipoChar =
    tipoConsejoUser && tipoEleccion && idConsejo
      ? TIPO_CHAR[tipoConsejoUser]
      : null;

  const {
    data: listaResult,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAperturasLista(tipoChar, idConsejo, tipoEleccion);

  const aperturas = useMemo(
    () => listaResult?.aperturas ?? [],
    [listaResult],
  );

  // ── Filtrado local (búsqueda por motivo) ──────────────────────────────────
  const dataFiltrada = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return aperturas;
    return aperturas.filter((a) => a.motivo.toLowerCase().includes(q));
  }, [aperturas, busqueda]);

  const handleReset = useCallback(() => {
    setTipoEleccion(eleccionesDisponibles[0]?.value ?? null);
    setBusqueda('');
  }, [eleccionesDisponibles]);

  // ── Estado de carga ──────────────────────────────────────────────────────
  if (!tipoConsejoUser || !idConsejo) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Tu usuario no tiene un consejo asignado. Contacta al administrador.
        </p>
      </div>
    );
  }

  if (isError) {
    return <EmptyStateErrorAperturas onReintentar={() => refetch()} />;
  }

  const emptyContent =
    busqueda.trim().length > 0 ? (
      <EmptyStateBusquedaApertura
        termino={busqueda}
        onLimpiar={() => setBusqueda('')}
      />
    ) : (
      <EmptyStateSinAperturas onReset={handleReset} />
    );

  const headerContent = (
    <div className="flex flex-wrap items-start gap-2 w-full">
      <AperturaSearchInput
        value={busqueda}
        onChange={setBusqueda}
        disabled={isLoading}
        resultCount={dataFiltrada.length}
      />
      <div className="ml-auto flex items-center gap-2">
        {canCrear && (
          <Button
            size="sm"
            disabled={isLoading || !tipoEleccion}
            onClick={() => router.push('/aperturas/nueva')}
          >
            <Plus className="size-4" />
            Nueva Apertura
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TipoEleccionPills
          options={eleccionesDisponibles}
          value={tipoEleccion}
          onChange={setTipoEleccion}
          isLoading={!catalogos}
          disabled={isLoading}
        />
      </div>

      <div
        className={[
          'transition-opacity duration-150 motion-reduce:transition-none',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        ].join(' ')}
      >
        <AperturasTable
          data={dataFiltrada}
          isLoading={isLoading}
          emptyContent={emptyContent}
          headerContent={headerContent}
        />
      </div>
    </div>
  );
}
