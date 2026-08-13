'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  FolderOpen,
  Lock,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useProceso } from '@/hooks/use-proceso';
import { useAperturasResumen } from '../_hooks/use-aperturas';
import { EmptyStateErrorAperturas } from './empty-state';
import type { IAperturaResumenConsejo } from '@/types/aperturas-bodegas';

// ─── Pills por tipo de consejo ────────────────────────────────────────────────

const PILLS: { value: 'D' | 'M'; label: string; icon: typeof Building }[] = [
  { value: 'D', label: 'Distritales', icon: Building },
  { value: 'M', label: 'Municipales', icon: MapPin },
];

function TipoConsejoPills({
  options,
  value,
  onChange,
  disabled,
}: {
  options: typeof PILLS;
  value: 'D' | 'M' | null;
  onChange: (v: 'D' | 'M') => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Tipo de consejo" className="flex flex-wrap gap-2">
      {options.map((op) => {
        const isActive = value === op.value;
        const Icon = op.icon;
        return (
          <button
            key={op.value}
            role="radio"
            aria-checked={isActive}
            type="button"
            disabled={disabled}
            onClick={() => onChange(op.value)}
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
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{op.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Chips de estatus (filtrado local) ───────────────────────────────────────

type TEstatusFiltro = 'abiertas' | 'cerradas';

const ESTATUS_CHIPS: {
  value: TEstatusFiltro;
  label: string;
  icon: typeof DoorOpen;
  activeClass: string;
}[] = [
  {
    value: 'abiertas',
    label: 'Abiertas',
    icon: DoorOpen,
    activeClass: 'bg-green-50 border-green-500 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  },
  {
    value: 'cerradas',
    label: 'Cerradas',
    icon: Lock,
    activeClass: 'bg-gray-100 border-gray-500 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
];

function EstatusChips({
  active,
  totals,
  onToggle,
  disabled,
}: {
  active: TEstatusFiltro[];
  totals: Record<TEstatusFiltro, number>;
  onToggle: (v: TEstatusFiltro) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estatus">
      {ESTATUS_CHIPS.map((chip) => {
        const isActive = active.includes(chip.value);
        const Icon = chip.icon;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={isActive}
            disabled={disabled}
            onClick={() => onToggle(chip.value)}
            className={[
              'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-xs font-medium',
              'transition-colors duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isActive
                ? chip.activeClass
                : 'bg-background border-input text-muted-foreground hover:bg-accent',
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{chip.label}</span>
            <span className="tabular-nums font-semibold">{totals[chip.value]}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Fila / tarjeta por consejo ──────────────────────────────────────────────

function hrefConsejo(c: IAperturaResumenConsejo): string {
  return `/aperturas/consejos/${c.tipo_consejo === 'D' ? 'distritales' : 'municipales'}/${c.id_consejo}`;
}

function tipoTexto(c: IAperturaResumenConsejo): string {
  return c.tipo_consejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal';
}

function ConsejoRow({ consejo }: { consejo: IAperturaResumenConsejo }) {
  return (
    <Link
      href={hrefConsejo(consejo)}
      className="grid grid-cols-5 gap-2 items-center py-2.5 px-3 text-sm border-b border-border last:border-b-0
        hover:bg-accent/50 transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="col-span-2">
        <div className="font-medium text-foreground truncate">
          {consejo.id_consejo}. {consejo.nombre_consejo}
        </div>
        <p className="text-[0.6875rem] text-muted-foreground mt-0.5">{tipoTexto(consejo)}</p>
      </div>
      <div className="text-center tabular-nums">{consejo.abiertas}</div>
      <div className="text-center tabular-nums">{consejo.cerradas}</div>
      <div className="text-center tabular-nums font-medium">{consejo.total}</div>
    </Link>
  );
}

function ConsejoMobileCard({ consejo }: { consejo: IAperturaResumenConsejo }) {
  const stats: { label: string; value: number }[] = [
    { label: 'Abiertas', value: consejo.abiertas },
    { label: 'Cerradas', value: consejo.cerradas },
    { label: 'Total', value: consejo.total },
  ];
  return (
    <Link href={hrefConsejo(consejo)} className="block">
      <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
        <header>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            #{consejo.id_consejo} · {tipoTexto(consejo)}
          </p>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
            {consejo.nombre_consejo}
          </h3>
        </header>
        <div className="grid grid-cols-3 gap-2" role="list" aria-label="Aperturas por estatus">
          {stats.map((s) => (
            <div
              key={s.label}
              role="listitem"
              className="flex flex-col items-center justify-center rounded-md p-2.5 bg-gray-50 dark:bg-gray-700/50"
            >
              <span className="text-lg font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                {s.value}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <footer className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-muted-foreground">Ver aperturas</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </footer>
      </article>
    </Link>
  );
}

function DesktopSkeleton() {
  return (
    <div className="space-y-1" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid grid-cols-5 gap-2 items-center py-2 px-3">
          <div className="col-span-2 space-y-1.5">
            <Skeleton className="h-4 w-40 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-3 w-24 animate-pulse motion-reduce:animate-none" />
          </div>
          {Array.from({ length: 3 }, (_, j) => (
            <Skeleton key={j} className="h-4 w-6 mx-auto animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      ))}
    </div>
  );
}

function MobileSkeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-3 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="w-44 h-5 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }, (_, j) => (
              <Skeleton key={j} className="h-14 rounded-md animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Paginación simple ───────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 30, 50, 100, 200];

function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}) {
  if (totalPages <= 1 && totalItems <= PAGE_SIZES[0]) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {totalItems} consejo{totalItems === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[0.6875rem] text-muted-foreground">Mostrar</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-7 rounded border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Registros por página"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function AperturasAdminDashboard() {
  const { data: proceso, isLoading: isLoadingProceso } = useProceso();

  // Pills disponibles según los tipos de consejo del proceso activo.
  const pillsDisponibles = useMemo(() => {
    const tipos = new Set(
      (proceso?.elecciones ?? []).map((e) => e.consejo_tipo as 'D' | 'M'),
    );
    return PILLS.filter((p) => tipos.has(p.value));
  }, [proceso]);

  const [tipoSeleccionado, setTipoSeleccionado] = useState<'D' | 'M' | null>(null);
  const tipoConsejo = tipoSeleccionado ?? pillsDisponibles[0]?.value ?? null;

  const [estadosActivos, setEstadosActivos] = useState<TEstatusFiltro[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  const {
    data: resumen,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAperturasResumen(tipoConsejo);

  const consejos = useMemo(() => resumen?.consejos ?? [], [resumen]);

  const totals: Record<TEstatusFiltro, number> = {
    abiertas: resumen?.progreso.abiertas ?? 0,
    cerradas: resumen?.progreso.cerradas ?? 0,
  };

  // Filtrado local: búsqueda por nombre + chips de estatus.
  const consejosFiltrados = useMemo(() => {
    let filtered = consejos;
    const q = busqueda.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(
        (c) =>
          c.nombre_consejo.toLowerCase().includes(q) ||
          String(c.id_consejo).includes(q),
      );
    }
    if (estadosActivos.length > 0) {
      filtered = filtered.filter((c) =>
        estadosActivos.some((s) => (s === 'abiertas' ? c.abiertas : c.cerradas) > 0),
      );
    }
    return filtered;
  }, [consejos, busqueda, estadosActivos]);

  const totalPages = Math.ceil(consejosFiltrados.length / pageSize);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return consejosFiltrados.slice(start, start + pageSize);
  }, [consejosFiltrados, safePage, pageSize]);

  function handleTipoChange(v: 'D' | 'M') {
    setTipoSeleccionado(v);
    setEstadosActivos([]);
    setBusqueda('');
    setCurrentPage(1);
  }

  function handleToggleEstatus(v: TEstatusFiltro) {
    setEstadosActivos((prev) =>
      prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v],
    );
    setCurrentPage(1);
  }

  if (isLoadingProceso) {
    return (
      <div className="space-y-4 animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="Cargando aperturas">
        <div className="h-8.5 bg-muted rounded-md w-48" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return <EmptyStateErrorAperturas onReintentar={() => refetch()} />;
  }

  const hayFiltros = estadosActivos.length > 0 || busqueda.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TipoConsejoPills
          options={pillsDisponibles}
          value={tipoConsejo}
          onChange={handleTipoChange}
          disabled={isLoading}
        />
        <EstatusChips
          active={estadosActivos}
          totals={totals}
          onToggle={handleToggleEstatus}
          disabled={isLoading}
        />
      </div>

      <div
        className={[
          'rounded-lg border border-border bg-card',
          'transition-opacity duration-150 motion-reduce:transition-none',
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100',
        ].join(' ')}
      >
        {/* Header: búsqueda + contador */}
        <div className="px-4 py-3 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar consejo..."
              disabled={isLoading}
              className="pl-9 pr-9"
              aria-label="Buscar consejo"
            />
            {busqueda && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  setBusqueda('');
                  setCurrentPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          {hayFiltros && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {consejosFiltrados.length} de {consejos.length} consejos
            </span>
          )}
        </div>

        {/* Vacíos */}
        {!isLoading && consejos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <FolderOpen className="h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
            <h3 className="text-base font-semibold text-foreground mb-1">Sin aperturas registradas</h3>
            <p className="text-sm text-muted-foreground">
              Ningún consejo de este tipo ha registrado aperturas de bodega.
            </p>
          </div>
        )}
        {!isLoading && consejos.length > 0 && consejosFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Search className="h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
            <h3 className="text-base font-semibold text-foreground mb-1">Sin resultados</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Ningún consejo coincide con los filtros seleccionados.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => {
                setEstadosActivos([]);
                setBusqueda('');
                setCurrentPage(1);
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        )}

        {(isLoading || consejosFiltrados.length > 0) && (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden p-3 space-y-3">
              {isLoading ? (
                <MobileSkeletons />
              ) : (
                paginated.map((c) => (
                  <ConsejoMobileCard key={`${c.tipo_consejo}-${c.id_consejo}`} consejo={c} />
                ))
              )}
            </div>

            {/* Desktop: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-5 gap-2 items-center py-2 px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40">
                  <div className="col-span-2">Consejo</div>
                  <div className="text-center">Abiertas</div>
                  <div className="text-center">Cerradas</div>
                  <div className="text-center">Total</div>
                </div>
                {isLoading ? (
                  <DesktopSkeleton />
                ) : (
                  paginated.map((c) => (
                    <ConsejoRow key={`${c.tipo_consejo}-${c.id_consejo}`} consejo={c} />
                  ))
                )}
              </div>
            </div>

            <SimplePagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={consejosFiltrados.length}
              pageSize={pageSize}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
