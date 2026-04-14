'use client';

import { CalendarOff, AlertTriangle, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Variante 1: sin datos del servidor ───────────────────────────────────────

interface SinDatosProps {
  onReset: () => void;
}

export function EmptyStateSinDatos({ onReset }: SinDatosProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div
        className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        <CalendarOff className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Sin resultados
      </h3>
      <p className="text-base text-gray-500 dark:text-gray-400 mb-5 max-w-xs">
        No hay consejos con sesiones para los filtros seleccionados.
      </p>
      <Button onClick={onReset} variant="outline" className="min-h-[44px]">
        Limpiar filtros
      </Button>
    </div>
  );
}

// ─── Variante 2: búsqueda sin coincidencias ────────────────────────────────────

interface BusquedaVaciaProps {
  termino: string;
  onLimpiar: () => void;
}

export function EmptyStateBusquedaVacia({ termino, onLimpiar }: BusquedaVaciaProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div
        className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3"
        aria-hidden="true"
      >
        <SearchX className="h-7 w-7 text-gray-400" />
      </div>
      <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
        Sin coincidencias para «{termino}»
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLimpiar}
        className="min-h-[44px] text-primary"
      >
        <span>Limpiar búsqueda</span>
      </Button>
    </div>
  );
}

// ─── Variante 3: error de carga ───────────────────────────────────────────────

interface ErrorCargaProps {
  onReintentar: () => void;
}

export function EmptyStateErrorCarga({ onReintentar }: ErrorCargaProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center px-4
        border border-red-200 dark:border-red-900 rounded-lg mx-4 my-4 bg-red-50/50 dark:bg-red-950/20"
    >
      <AlertTriangle
        className="h-10 w-10 text-danger mb-3"
        aria-hidden="true"
      />
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        No se pudo cargar la información.
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Verifique su conexión e intente de nuevo.
      </p>
      <Button onClick={onReintentar} className="min-h-[44px]">
        Reintentar
      </Button>
    </div>
  );
}
