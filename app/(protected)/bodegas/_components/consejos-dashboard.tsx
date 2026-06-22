'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FolderOpen, X, Plus, FileSpreadsheet, Loader2, ChevronLeft, ChevronRight, ChevronsUpDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import type { IBodegaDashboardConsejo } from '@/types/bodegas';

// ─── Combobox filtro de consejo (client-side, NO navega) ────────────────────────

function FiltrarConsejoCombobox({
  consejos,
  isLoading,
  value,
  onChange,
}: {
  consejos: IBodegaDashboardConsejo[];
  isLoading: boolean;
  value: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-9 w-64 animate-pulse motion-reduce:animate-none" />;
  }

  if (consejos.length === 0) return null;

  const selected = consejos.find((c) => `${c.tipo_consejo}-${c.id_consejo}` === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full sm:w-64 justify-between"
        >
          <span className="text-xs">
            {selected ? selected.nombre_consejo : 'Filtrar consejo…'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:w-64 p-0">
        <Command>
          <CommandInput placeholder="Buscar consejo…" />
          <CommandList>
            <CommandEmpty>No se encontró ningún consejo.</CommandEmpty>
            <CommandGroup>
              {consejos.map((c) => {
                const key = `${c.tipo_consejo}-${c.id_consejo}`;
                return (
                  <CommandItem
                    key={key}
                    value={key}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <span className='text-xs'>{c.id_consejo != null ? `${c.id_consejo}. ` : ''}{c.nombre_consejo}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Mapeo status → key en IBodegaDashboardConsejo ──────────────────────────────

const STATUS_KEY_MAP: Record<string, keyof IBodegaDashboardConsejo> = {
  'En captura': 'captura',
  Capturada: 'capturada',
  Observada: 'observada',
  Determinada: 'determinada',
  Verificada: 'verificada',
  Aceptada: 'aceptada',
  Rechazada: 'rechazada',
};

// ─── Config de labels para stats ────────────────────────────────────────────────

const STAT_LABELS: Array<{ key: keyof IBodegaDashboardConsejo; label: string }> = [
  { key: 'total', label: 'Total' },
  { key: 'captura', label: 'En captura' },
  { key: 'capturada', label: 'Capturada' },
  { key: 'observada', label: 'Observada' },
  { key: 'determinada', label: 'Determinada' },
  { key: 'verificada', label: 'Verificada' },
  { key: 'aceptada', label: 'Aceptada' },
  { key: 'rechazada', label: 'Rechazada' },
];

// ─── Tarjeta móvil para consejo ────────────────────────────────────────────────

function ConsejoMobileCard({ consejo, tipoConsejo }: { consejo: IBodegaDashboardConsejo; tipoConsejo?: string }) {
  const isOC = consejo.tipo_consejo == null || consejo.id_consejo == null;
  const href = isOC
    ? '/bodegas/oficina-central'
    : `/bodegas/consejos/${consejo.tipo_consejo === 'D' ? 'distritales' : 'municipales'}/${consejo.id_consejo}`;
  const tipoTexto = isOC
    ? 'Oficina Central'
    : consejo.tipo_consejo === 'D' ? 'Consejo Distrital' : 'Consejo Municipal';

  return (
    <Link href={href} className="block">
      <article className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
        <header>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {isOC ? 'Oficina Central' : `#${consejo.id_consejo} · ${tipoTexto}`}
          </p>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
            {consejo.nombre_consejo}
          </h3>
        </header>

        <div className="grid grid-cols-2 gap-2" role="list" aria-label="Estadísticas">
          {STAT_LABELS.map(({ key, label }) => {
            const value = consejo[key] as number;
            return (
              <div
                key={key}
                role="listitem"
                className="flex flex-col items-center justify-center rounded-md p-2.5 bg-gray-50 dark:bg-gray-700/50"
              >
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {value}
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <footer className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-muted-foreground">Ver bodegas</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </footer>
      </article>
    </Link>
  );
}

function ConsejoMobileSkeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
          <div className="space-y-1.5">
            <Skeleton className="w-28 h-3 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="w-44 h-5 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 8 }, (_, j) => (
              <Skeleton key={j} className="h-14 rounded-md animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <Skeleton className="h-4 w-20 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-4 w-4 animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Fila de consejo (desktop) ─────────────────────────────────────────────────

function ConsejoRow({ consejo, tipoConsejo }: { consejo: IBodegaDashboardConsejo; tipoConsejo?: string }) {
  const isOC = consejo.tipo_consejo == null || consejo.id_consejo == null;

  // Rutas semánticas limpias
  const href = isOC
    ? '/bodegas/oficina-central'
    : `/bodegas/consejos/${consejo.tipo_consejo === 'D' ? 'distritales' : 'municipales'}/${consejo.id_consejo}`;

  const tipoTexto =
    consejo.tipo_consejo === 'D'
      ? 'Consejo Distrital'
      : consejo.tipo_consejo === 'M'
        ? 'Consejo Municipal'
        : 'Oficina Central';

  return (
    <Link
      href={href}
      className="grid grid-cols-10 gap-2 items-center py-2.5 px-3 text-sm border-b border-border last:border-b-0
        hover:bg-accent/50 transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {/* 1. NOMBRE CONSEJO (con clave concatenada) */}
      <div className="col-span-2">
        <div className="font-medium text-foreground truncate">
          {consejo.id_consejo != null ? `${consejo.id_consejo}. ` : ''}
          {consejo.nombre_consejo}
        </div>
        <p className="text-[0.6875rem] text-muted-foreground mt-0.5">
          {tipoTexto}
        </p>
      </div>

      {/* Estadísticas */}
      <div className="text-center">{consejo.total}</div>
      <div className="text-center">{consejo.captura}</div>
      <div className="text-center">{consejo.capturada}</div>
      <div className="text-center">{consejo.observada}</div>
      <div className="text-center">{consejo.determinada}</div>
      <div className="text-center">{consejo.verificada}</div>
      <div className="text-center">{consejo.aceptada}</div>
      <div className="text-center">{consejo.rechazada}</div>
    </Link>
  );
}

function ConsejosSkeleton() {
  return (
    <div className="space-y-1" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="grid grid-cols-10 gap-2 items-center py-2 px-3">
          <div className="col-span-2 space-y-1.5">
            <Skeleton className="h-4 w-32 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-3 w-20 animate-pulse motion-reduce:animate-none" />
          </div>
          {Array.from({ length: 8 }, (_, j) => (
            <Skeleton key={j} className="h-4 w-6 mx-auto animate-pulse motion-reduce:animate-none" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Paginación simple ────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

function SimplePagination({ currentPage, totalPages, onPageChange, totalItems, pageSize, onPageSizeChange }: PaginationProps) {
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

// ─── Componente principal ─────────────────────────────────────────────────────

interface ConsejosDashboardProps {
  consejos: IBodegaDashboardConsejo[];
  isLoading: boolean;
  tipoConsejo?: string;
  activeFilters: string[];
  onExport: () => void;
  isExporting: boolean;
  canCrear: boolean;
  onNueva: () => void;
  onRestoreAll?: () => void;
}

const PAGE_SIZES = [10, 20, 30, 50, 100, 200];

export function ConsejosDashboard({ consejos, isLoading, tipoConsejo, activeFilters, onExport, isExporting, canCrear, onNueva, onRestoreAll }: ConsejosDashboardProps) {
  const [filtroKey, setFiltroKey] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // Filtrado client-side: combobox + status cards
  const hasStatusFilter = activeFilters.length > 0;
  const consejosFiltrados = useMemo(() => {
    let filtered = consejos;
    // Status card filter: show consejos with records in ANY selected status
    if (hasStatusFilter) {
      filtered = filtered.filter((c) =>
        activeFilters.some((s) => {
          const key = STATUS_KEY_MAP[s];
          return key ? (c[key] as number) > 0 : false;
        }),
      );
    }
    // Combobox filter
    if (filtroKey) {
      filtered = filtered.filter((c) => `${c.tipo_consejo}-${c.id_consejo}` === filtroKey);
    }
    return filtered;
  }, [consejos, activeFilters, filtroKey, hasStatusFilter]);

  // Paginación
  const totalPages = Math.ceil(consejosFiltrados.length / pageSize);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return consejosFiltrados.slice(start, start + pageSize);
  }, [consejosFiltrados, safePage, pageSize]);

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setCurrentPage(1);
  }

  if (consejos.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4 border border-border rounded-lg bg-card">
        <FolderOpen className="h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
        <h3 className="text-base font-semibold text-foreground mb-1">Sin consejos activos</h3>
        <p className="text-sm text-muted-foreground">No hay consejos configurados para este tipo.</p>
      </div>
    );
  }

  if (consejosFiltrados.length === 0 && hasStatusFilter) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FiltrarConsejoCombobox
            consejos={consejos}
            isLoading={isLoading}
            value={filtroKey}
            onChange={(key) => { setFiltroKey(key); setCurrentPage(1); }}
          />
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button variant="outline" size="sm" onClick={onExport} disabled={isLoading || isExporting} className="gap-1.5" aria-label="Exportar a Excel">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
              <span>Exportar</span>
            </Button>
            {canCrear && (
              <Button variant="primary" size="sm" className="gap-1.5" onClick={onNueva}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nueva Bodega
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
          <Filter className="h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
          <h3 className="text-base font-semibold text-foreground mb-1">Sin resultados</h3>
          <p className="text-sm text-muted-foreground mb-3">Ningún consejo tiene registros en los estados seleccionados.</p>
          <Button variant="ghost" size="sm" onClick={() => onRestoreAll?.()} className="text-primary">Limpiar filtros</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header: filtro combobox + indicador + acciones */}
      <div className="px-4 py-3 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FiltrarConsejoCombobox
            consejos={consejos}
            isLoading={isLoading}
            value={filtroKey}
            onChange={(key) => {
              setFiltroKey(key);
              setCurrentPage(1);
            }}
          />
          {hasStatusFilter && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {consejosFiltrados.length} de {consejos.length} consejos
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {filtroKey && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1 text-muted-foreground"
              onClick={() => {
                setFiltroKey('');
                setCurrentPage(1);
              }}
            >
              <X className="h-4 w-4" />
              Limpiar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onExport} disabled={isLoading || isExporting} className="gap-1.5" aria-label="Exportar a Excel">
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
            <span>Exportar</span>
          </Button>
          {canCrear && (
            <Button variant="primary" size="sm" className="gap-1.5" onClick={onNueva}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nueva Bodega
            </Button>
          )}
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <ConsejoMobileSkeletons />
        ) : (
          paginated.map((c) => {
            const rowKey =
              c.id_consejo != null && c.tipo_consejo != null
                ? `${c.tipo_consejo}-${c.id_consejo}`
                : `oc-${c.nombre_consejo}`;
            return <ConsejoMobileCard key={rowKey} consejo={c} tipoConsejo={tipoConsejo} />;
          })
        )}
        <SimplePagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={consejosFiltrados.length}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Desktop: tabla */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-10 gap-2 items-center py-2 px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40">
              <div className="col-span-2">Consejo</div>
              <div className="text-center">Total</div>
              <div className="text-center">En captura</div>
              <div className="text-center">Capturada</div>
              <div className="text-center">Observada</div>
              <div className="text-center">Determinada</div>
              <div className="text-center">Verificada</div>
              <div className="text-center">Aceptada</div>
              <div className="text-center">Rechazada</div>
            </div>
            {isLoading ? (
              <ConsejosSkeleton />
            ) : (
              paginated.map((c) => {
                const rowKey =
                  c.id_consejo != null && c.tipo_consejo != null
                    ? `${c.tipo_consejo}-${c.id_consejo}`
                    : `oc-${c.nombre_consejo}`;
                return <ConsejoRow key={rowKey} consejo={c} tipoConsejo={tipoConsejo} />;
              })
            )}
          </div>
        </div>

        <SimplePagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={consejosFiltrados.length}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}
