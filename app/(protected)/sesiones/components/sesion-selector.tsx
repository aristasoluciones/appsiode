'use client';

import { useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ISesionOption } from '@/types/sesiones';

const TODAS = '__todas__';

interface SesionSelectorProps {
  value: string | null;
  options: ISesionOption[];
  isLoading?: boolean;
  onChange: (sesionId: string | null) => void;
  disabled?: boolean;
}

export function SesionSelector({
  value,
  options,
  isLoading = false,
  onChange,
  disabled = false,
}: SesionSelectorProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="flex items-center gap-1">
      <Select
        value={value ?? TODAS}
        onValueChange={(v) => onChange(v === TODAS ? null : v)}
        onOpenChange={(open) => {
          if (open) {
            setTimeout(() => inputRef.current?.focus(), 0);
          } else {
            setSearch('');
          }
        }}
        disabled={disabled || isLoading}
        indicatorVisibility={false}
      >
        <SelectTrigger aria-label="Seleccionar sesión" className="w-full sm:w-72">
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
              Cargando sesiones...
            </span>
          ) : (
            <SelectValue placeholder="Todas las sesiones" />
          )}
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-1.5 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                placeholder="Buscar sesión..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                className="pl-8 h-8"
              />
            </div>
          </div>
          <SelectItem value={TODAS}>Todas las sesiones</SelectItem>
          {filtered.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">Sin resultados</p>
          ) : (
            filtered.map((op) => (
              <SelectItem key={op.id} value={op.id}>
                {op.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {value !== null && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8.5 w-8.5 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Limpiar selección"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
