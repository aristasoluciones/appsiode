'use client';

import { AlertTriangle, FileText, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** El consejo todavía no genera actas, o ninguna coincide con la búsqueda. */
export function EmptyStateSinActas({
  busqueda = false,
}: {
  busqueda?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div
        className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4"
        aria-hidden="true"
      >
        {busqueda ? (
          <SearchX className="h-8 w-8 text-gray-400" />
        ) : (
          <FileText className="h-8 w-8 text-gray-400" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {busqueda ? 'Ninguna acta coincide' : 'Sin actas circunstanciadas'}
      </h3>
      <p className="text-base text-gray-500 dark:text-gray-400 max-w-sm">
        {busqueda
          ? 'Prueba con otro estatus, nombre, ciudad o lugar.'
          : 'Cuando termines la comprobación física, genera el acta con el botón de arriba.'}
      </p>
    </div>
  );
}

export function EmptyStateErrorActas({
  onReintentar,
}: {
  onReintentar: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center px-4
        border border-red-200 dark:border-red-900 rounded-lg my-4 bg-red-50/50 dark:bg-red-950/20"
    >
      <AlertTriangle
        className="h-10 w-10 text-danger mb-3"
        aria-hidden="true"
      />
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        No se pudieron cargar las actas.
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
