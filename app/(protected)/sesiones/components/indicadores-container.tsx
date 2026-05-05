'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type TEstadoIndicador,
  useIndicadoresData,
  useSesionesOptions,
} from './indicadores-data';
import { useProceso, CONSEJO_TIPO_MAP, type TTipoConsejo } from '@/hooks/use-proceso';
import { TipoConsejoPills, type TipoConsejoOpcion } from './tipo-consejo-pills';
import { EstadoChips } from './estado-chips';
import { SesionSelector } from './sesion-selector';
import { SearchInput } from './search-input';
import { ActiveFiltersBar } from './active-filters-bar';
import { ExportButtons } from './export-buttons';
import { IndicadoresTable } from './indicadores-table';
import {
  EmptyStateErrorCarga,
  EmptyStateSinDatos,
  EmptyStateBusquedaVacia,
} from './empty-state';

import { useAuth } from '@/providers/auth-provider';

// ─── Helper: debounce ─────────────────────────────────────────────────────────

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Estado inicial ───────────────────────────────────────────────────────────

const TODOS_ESTADOS: TEstadoIndicador[] = [
  'programada',
  'con_demora',
  'en_proceso',
  'concluida',
];

// ─── Contenedor principal ─────────────────────────────────────────────────────

export function IndicadoresContainer() {
  const { data: proceso, isLoading: isLoadingProceso } = useProceso();
  const router = useRouter();
  const { hasPermission } = useAuth();

  const canAgregarSesion = hasPermission('sesiones.crear');

  // null = "usar el primer tipo del proceso" (default dinámico desde API).
  // Solo se vuelve no-null cuando el usuario elige explícitamente una pill.
  const [tipoConsejo, setTipoConsejo] = useState<TTipoConsejo | null>(null);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [estadosActivos, setEstadosActivos] = useState<Set<TEstadoIndicador>>(
    new Set(TODOS_ESTADOS),
  );
  const [busqueda, setBusqueda] = useState('');

  // Opciones derivadas del proceso para los pills
  const procesoOpciones = useMemo<TipoConsejoOpcion[]>(
    () =>
      (proceso?.elecciones ?? []).map((e) => ({
        value: CONSEJO_TIPO_MAP[e.consejo_tipo],
        label: e.consejo_tipo_text,
      })),
    [proceso],
  );

  // El tipo efectivo: elección explícita del usuario → primero de la API → fallback
  const tipoConsejoEfectivo: TTipoConsejo =
    tipoConsejo ??
    (proceso?.elecciones?.[0]?.consejo_tipo
      ? CONSEJO_TIPO_MAP[proceso.elecciones[0].consejo_tipo]
      : 'distrital');

  // Debounce para queryKey (re-fetch al servidor)
  const debouncedTipoConsejo = useDebounced(tipoConsejoEfectivo, 300);
  const debouncedSesionId = useDebounced(sesionId, 300);

  // Debounce para filtrado local (búsqueda)
  const debouncedBusqueda = useDebounced(busqueda, 200);

  // Datos
  const {
    data: rawData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useIndicadoresData(debouncedTipoConsejo, debouncedSesionId);

  const {
    data: sesionesOptions = [],
    isLoading: isLoadingSesiones,
  } = useSesionesOptions(debouncedTipoConsejo);

  // ── Filtrado local ───────────────────────────────────────────────────────────

  // 1. Busqueda → para los conteos de chips
  const dataPostBusqueda = useMemo(() => {
    const source = rawData ?? [];
    const q = debouncedBusqueda.toLowerCase().trim();
    if (!q) return source;
    return source.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        r.clave.toLowerCase().includes(q),
    );
  }, [rawData, debouncedBusqueda]);

  // 2. Conteos para chips (se calculan del resultado post-búsqueda)
  const chipConteos = useMemo(
    () => ({
      programada: dataPostBusqueda.reduce((s, r) => s + r.programadas, 0),
      con_demora: dataPostBusqueda.reduce((s, r) => s + r.conDemora, 0),
      en_proceso: dataPostBusqueda.reduce((s, r) => s + r.enProceso, 0),
      concluida: dataPostBusqueda.reduce((s, r) => s + r.concluidas, 0),
    }),
    [dataPostBusqueda],
  );

  // 3. Filtrado por chips de estado
  const dataFinal = useMemo(() => {
    if (estadosActivos.size === TODOS_ESTADOS.length) return dataPostBusqueda;
    if (estadosActivos.size === 0) return [];
    return dataPostBusqueda.filter(
      (r) =>
        (estadosActivos.has('programada') && r.programadas > 0) ||
        (estadosActivos.has('con_demora') && r.conDemora > 0) ||
        (estadosActivos.has('en_proceso') && r.enProceso > 0) ||
        (estadosActivos.has('concluida') && r.concluidas > 0),
    );
  }, [dataPostBusqueda, estadosActivos]);

  // ── Filtros activos ──────────────────────────────────────────────────────────

  const isFiltered = useMemo(
    () =>
      tipoConsejo !== null ||
      sesionId !== null ||
      estadosActivos.size !== TODOS_ESTADOS.length ||
      busqueda !== '',
    [tipoConsejo, sesionId, estadosActivos, busqueda],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleToggleEstado = useCallback((estado: TEstadoIndicador) => {
    setEstadosActivos((prev) => {
      const next = new Set(prev);
      if (next.has(estado)) {
        next.delete(estado);
      } else {
        next.add(estado);
      }
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setTipoConsejo(null);
    setSesionId(null);
    setEstadosActivos(new Set(TODOS_ESTADOS));
    setBusqueda('');
  }, []);

  // ── Estado de error ──────────────────────────────────────────────────────────

  if (isError) {
    return <EmptyStateErrorCarga onReintentar={() => refetch()} />;
  }

  // ── Determinar contenido vacío ───────────────────────────────────────────────

  const emptyContent =
    debouncedBusqueda.trim().length > 0 ? (
      <EmptyStateBusquedaVacia
        termino={debouncedBusqueda}
        onLimpiar={() => setBusqueda('')}
      />
    ) : (
      <EmptyStateSinDatos onReset={handleReset} />
    );

  // ── Header Content para la tabla ─────────────────────────────────────────────

  const headerContent = (
    <>
      {/* Controles: sesión + búsqueda + exportar + nueva sesión */}
      <div className="flex flex-wrap items-start gap-2 w-full">
        <SesionSelector
          value={sesionId}
          options={sesionesOptions}
          isLoading={isLoadingSesiones}
          onChange={setSesionId}
          disabled={isLoading}
        />
        <SearchInput
          value={busqueda}
          onChange={setBusqueda}
          disabled={isLoading}
          resultCount={dataPostBusqueda.length}
        />
        <div className="ml-auto flex items-center gap-2">
          <ExportButtons data={dataFinal} disabled={isLoading} />
          {canAgregarSesion && (
            <Button size="sm" disabled={isLoading} onClick={() => router.push('/sesiones/new')}>
              <Plus className="size-4" />
              Nueva Sesión
            </Button>
          )}
        </div>
      </div>

      {/* Barra de filtros activos (full width) */}
      {isFiltered && (
        <div className="w-full">
          <ActiveFiltersBar isVisible={isFiltered} onReset={handleReset} />
        </div>
      )}
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Selector de tipo de consejo + chips de estado en la misma fila */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TipoConsejoPills
          value={tipoConsejoEfectivo}
          onChange={setTipoConsejo}
          opciones={procesoOpciones}
          isLoading={isLoadingProceso}
          disabled={isLoading}
        />
        <EstadoChips
          activos={estadosActivos}
          conteos={chipConteos}
          onToggle={handleToggleEstado}
          disabled={isLoading}
        />
      </div>

      {/* Tabla con opacidad reducida mientras re-fetcha en background */}
      <div
        className={[
          'transition-opacity duration-150 motion-reduce:transition-none',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        ].join(' ')}
      >
        <IndicadoresTable
          data={dataFinal}
          isLoading={isLoading}
          tipoConsejo={debouncedTipoConsejo}
          emptyContent={emptyContent}
          headerContent={headerContent}
        />
      </div>

    </div>
  );
}
