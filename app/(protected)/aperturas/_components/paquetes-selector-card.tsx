'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronsUpDown, Plus, SearchX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ICatalogoCasilla, IPaqueteApertura } from '@/types/aperturas-bodegas';

const NONE = '__none__';

function uniqueUid() {
  return `paq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export interface PaquetesSelectorCardProps {
  items: IPaqueteApertura[];
  onChange: (items: IPaqueteApertura[]) => void;
  readOnly: boolean;
  casillas?: ICatalogoCasilla[];
  secciones?: { seccion: number }[];
  required?: boolean;
}

// ─── Combobox de Sección con buscador y clear ────────────────────────────────

interface SeccionComboboxProps {
  secciones: number[];
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
}

function SeccionCombobox({
  secciones,
  value,
  onChange,
  disabled,
}: SeccionComboboxProps) {
  const [open, setOpen] = useState(false);
  const listboxId = `seccion-combobox-listbox`;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-input bg-background h-8.5 px-3',
            'text-[0.8125rem] text-left shadow-xs shadow-black/5 transition-shadow',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            value === null && 'text-muted-foreground',
          )}
        >
          <span className="truncate">
            {value !== null ? value : 'Selecciona...'}
          </span>
          <span className="flex items-center gap-0.5 shrink-0">
            {value !== null && !disabled && (
              <span
                role="button"
                aria-label="Limpiar selección"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="rounded p-0.5 hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command id={listboxId}>
          <CommandInput placeholder="Buscar sección..." />
          <CommandList>
            <CommandEmpty>Sin secciones.</CommandEmpty>
            <CommandGroup>
              {secciones.map((s) => (
                <CommandItem
                  key={s}
                  value={String(s)}
                  onSelect={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                >
                  {s}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function PaquetesSelectorCard({
  items,
  onChange,
  readOnly,
  casillas,
  secciones,
  required = false,
}: PaquetesSelectorCardProps) {
  const [seccionSel, setSeccionSel] = useState<number | null>(null);
  const [casillaSel, setCasillaSel] = useState<string>(NONE);

  // Catálogo de secciones: del endpoint SECCIONES si está; si no, derivado de casillas.
  const seccionesDisponibles = useMemo(() => {
    if (secciones?.length) {
      return Array.from(new Set(secciones.map((s) => s.seccion))).sort(
        (a, b) => a - b,
      );
    }
    if (casillas?.length) {
      return Array.from(new Set(casillas.map((c) => c.seccion))).sort(
        (a, b) => a - b,
      );
    }
    return [];
  }, [secciones, casillas]);

  // Casillas filtradas por la sección seleccionada (sirven para mostrar la descripción).
  const casillasFiltradas = useMemo(() => {
    if (seccionSel === null) return [];
    return (casillas ?? []).filter((c) => c.seccion === seccionSel);
  }, [casillas, seccionSel]);

  // Resetear el select de casilla cuando cambia la sección.
  useEffect(() => {
    setCasillaSel(NONE);
  }, [seccionSel]);

  function agregar() {
    if (seccionSel === null || casillaSel === NONE) return;
    const cas = casillasFiltradas.find((c) => c.casilla === casillaSel);
    if (!cas) return;
    const duplicado = items.some(
      (p) => p.seccion === seccionSel && p.casilla === cas.casilla,
    );
    if (duplicado) return;
    onChange([
      ...items,
      {
        uid: uniqueUid(),
        seccion: seccionSel,
        casilla: cas.casilla,
        casilla_desc: cas.casilla_desc,
      },
    ]);
  }

  function quitar(uid: string) {
    onChange(items.filter((p) => p.uid !== uid));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>
          Paquetes Electorales
          {required && <span className="text-destructive"> *</span>}
        </CardTitle>
        {!readOnly && (
          <span className="text-xs text-muted-foreground">
            {items.length} paquete{items.length === 1 ? '' : 's'} seleccionado
            {items.length === 1 ? '' : 's'}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!readOnly && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <label
                htmlFor="paq-seccion"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Sección
              </label>
              <SeccionCombobox
                secciones={seccionesDisponibles}
                value={seccionSel}
                onChange={setSeccionSel}
                disabled={seccionesDisponibles.length === 0}
              />
            </div>

            <div>
              <label
                htmlFor="paq-casilla"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Casilla
              </label>
              <Select
                value={casillaSel}
                onValueChange={setCasillaSel}
                disabled={seccionSel === null || casillasFiltradas.length === 0}
                indicatorVisibility={false}
              >
                <SelectTrigger id="paq-casilla" className="w-full">
                  <SelectValue
                    placeholder={
                      seccionSel === null
                        ? 'Selecciona sección'
                        : casillasFiltradas.length === 0
                          ? 'Sin casillas'
                          : 'Selecciona...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {casillasFiltradas.map((c) => (
                    <SelectItem key={c.id} value={c.casilla}>
                      {c.casilla} · {c.casilla_desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={agregar}
              disabled={seccionSel === null || casillaSel === NONE}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            <SearchX className="inline h-4 w-4 mr-1.5 -mt-0.5 opacity-60" />
            Sin paquetes agregados.
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {items.map((p) => (
              <li
                key={p.uid}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="flex items-start gap-6 min-w-0">
                  <div className="min-w-[80px]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Sección
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                      {p.seccion}
                    </p>
                  </div>
                  <div className="min-w-[80px]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Casilla
                    </p>
                    <p className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                      {p.casilla}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Tipo
                    </p>
                    <p className="text-sm text-foreground leading-tight mt-0.5 truncate">
                      {p.casilla_desc || '—'}
                    </p>
                  </div>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    aria-label={`Quitar paquete sección ${p.seccion}`}
                    onClick={() => quitar(p.uid)}
                    className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}