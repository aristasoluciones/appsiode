'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  resultCount?: number;
}

export function SearchInput({
  value,
  onChange,
  disabled = false,
  resultCount,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Accesibilidad: mostrar resultado de búsqueda para lectores de pantalla
  const ariaMessage =
    value.trim().length > 0
      ? `${resultCount ?? 0} resultados para "${value}"`
      : undefined;

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Buscar consejo..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label="Buscar consejo por nombre o clave"
          className="pl-9 pr-9 w-full sm:w-64"
        />
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Estado vacío por búsqueda — mensaje inline */}
      {value.trim().length > 0 && resultCount === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 px-1">
          Sin coincidencias para «{value}»
        </p>
      )}

      {/* Región live para lectores de pantalla */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {ariaMessage}
      </div>
    </div>
  );
}
