'use client';

import { useState } from 'react';
import { ChevronsUpDown, Tags } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface ITipoArticuloOpcion {
  /** Clave del tipo (DOCUMENTO, MATERIAL, BOLETA…). */
  value: string;
  label: string;
  total: number;
}

interface TipoArticuloFiltroProps {
  opciones: ITipoArticuloOpcion[];
  /** Claves elegidas; vacío = todos los tipos. */
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

/** Selección de uno o varios tipos de artículo; sin selección se muestran todos. */
export function TipoArticuloFiltro({
  opciones,
  value,
  onChange,
  disabled = false,
}: TipoArticuloFiltroProps) {
  const [open, setOpen] = useState(false);

  function alternar(clave: string) {
    onChange(
      value.includes(clave)
        ? value.filter((v) => v !== clave)
        : [...value, clave],
    );
  }

  const etiqueta =
    value.length === 0
      ? 'Todos los tipos'
      : value.length === 1
        ? (opciones.find((o) => o.value === value[0])?.label ?? value[0])
        : `${value.length} tipos`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Filtrar por tipo de artículo"
          disabled={disabled || opciones.length === 0}
          className="w-full sm:w-56 justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Tags
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="truncate">{etiqueta}</span>
          </span>
          <ChevronsUpDown
            className="h-4 w-4 shrink-0 opacity-50"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0">
        <Command>
          <CommandInput placeholder="Buscar tipo…" />
          <CommandList>
            <CommandEmpty>No hay tipos con ese nombre.</CommandEmpty>
            <CommandGroup>
              {opciones.map((o) => {
                const marcado = value.includes(o.value);
                return (
                  <CommandItem
                    key={o.value}
                    value={`${o.label} ${o.value}`}
                    onSelect={() => alternar(o.value)}
                    aria-selected={marcado}
                  >
                    <Checkbox
                      checked={marcado}
                      tabIndex={-1}
                      aria-hidden="true"
                      className="pointer-events-none"
                    />
                    <span className="flex-1 truncate">{o.label}</span>
                    <Badge variant="secondary" appearance="light" size="sm">
                      {o.total}
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {value.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__todos__"
                    onSelect={() => onChange([])}
                    className="justify-center text-muted-foreground"
                  >
                    Mostrar todos los tipos
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
