'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FolderOpen, X, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
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

// ─── Fila de consejo ──────────────────────────────────────────────────────────

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
      className="grid grid-cols-9 gap-2 items-center py-2.5 px-3 text-sm border-b border-border last:border-b-0
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
      <div className="text-center">{consejo.registrada}</div>
      <div className="text-center">{consejo.observada}</div>
      <div className="text-center">{consejo.validada}</div>
      <div className="text-center">{consejo.verificada}</div>
      <div className="text-center">{consejo.informada}</div>
    </Link>
  );
}

function ConsejosSkeleton() {
  return (
    <div className="space-y-1" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="grid grid-cols-9 gap-2 items-center py-2 px-3">
          <div className="col-span-2 space-y-1.5">
            <Skeleton className="h-4 w-32 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-3 w-20 animate-pulse motion-reduce:animate-none" />
          </div>
          {Array.from({ length: 7 }, (_, j) => (
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
}

function SimplePagination({ currentPage, totalPages, onPageChange, totalItems }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-xs text-muted-foreground">
        {totalItems} consejo{totalItems === 1 ? '' : 's'}
      </span>
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
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface ConsejosDashboardProps {
  consejos: IBodegaDashboardConsejo[];
  isLoading: boolean;
  tipoConsejo?: string;
}

export function ConsejosDashboard({ consejos, isLoading, tipoConsejo }: ConsejosDashboardProps) {
  const [filtroKey, setFiltroKey] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtrado client-side
  const consejosFiltrados = useMemo(() => {
    if (!filtroKey) return consejos;
    return consejos.filter((c) => `${c.tipo_consejo}-${c.id_consejo}` === filtroKey);
  }, [consejos, filtroKey]);

  // Paginación
  const totalPages = Math.ceil(consejosFiltrados.length / pageSize);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return consejosFiltrados.slice(start, start + pageSize);
  }, [consejosFiltrados, currentPage]);

  if (consejos.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4 border border-border rounded-lg bg-card">
        <FolderOpen className="h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
        <h3 className="text-base font-semibold text-foreground mb-1">Sin consejos activos</h3>
        <p className="text-sm text-muted-foreground">No hay consejos configurados para este tipo.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header: título + filtro combobox */}
      <div className="px-4 py-3 border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Desglose por consejo</h3>
          <p className="text-xs text-muted-foreground">
            {filtroKey
              ? 'Mostrando 1 consejo seleccionado'
              : 'Haz clic en un consejo para ver sus bodegas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FiltrarConsejoCombobox
            consejos={consejos}
            isLoading={isLoading}
            value={filtroKey}
            onChange={(key) => {
              setFiltroKey(key);
              setCurrentPage(1);
            }}
          />
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
        </div>
      </div>

      {/* Tabla con consejos filtrados y paginados */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-9 gap-2 items-center py-2 px-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/40">
            <div className="col-span-2">Consejo</div>
            <div className="text-center">Total</div>
            <div className="text-center">En captura</div>
            <div className="text-center">Registrada</div>
            <div className="text-center">Observada</div>
            <div className="text-center">Validada</div>
            <div className="text-center">Verificada</div>
            <div className="text-center">Informada</div>
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

      {/* Paginación */}
      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={consejosFiltrados.length}
      />
    </div>
  );
}
