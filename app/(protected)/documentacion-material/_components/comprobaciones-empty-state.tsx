'use client';

import { AlertTriangle, PackageOpen, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** El consejo aún no tiene renglones cargados por la oficina central. */
export function EmptyStateSinDocumentos() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div
        className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        <PackageOpen className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Sin documentación ni material
      </h3>
      <p className="text-base text-gray-500 dark:text-gray-400 max-w-sm">
        Todavía no se ha cargado la lista de documentación y material de este
        consejo. La carga la realiza la oficina central.
      </p>
    </div>
  );
}

interface SinResultadosProps {
  onLimpiar: () => void;
}

/** Hay renglones, pero ninguno pasa los filtros activos en pantalla. */
export function EmptyStateSinResultados({ onLimpiar }: SinResultadosProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      <div
        className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3"
        aria-hidden="true"
      >
        <SearchX className="h-7 w-7 text-gray-400" />
      </div>
      <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
        Ningún renglón coincide con los filtros
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLimpiar}
        className="min-h-[44px] text-primary"
      >
        <span>Limpiar filtros</span>
      </Button>
    </div>
  );
}

interface ErrorCargaProps {
  onReintentar: () => void;
}

export function EmptyStateErrorComprobaciones({
  onReintentar,
}: ErrorCargaProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center px-4
        border border-red-200 dark:border-red-900 rounded-lg my-4 bg-red-50/50 dark:bg-red-950/20"
    >
      <AlertTriangle className="h-10 w-10 text-danger mb-3" aria-hidden="true" />
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        No se pudo cargar la comprobación física.
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Verifica tu conexión e intenta de nuevo.
      </p>
      <Button onClick={onReintentar} className="min-h-[44px]">
        Reintentar
      </Button>
    </div>
  );
}
