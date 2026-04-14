'use client';

import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActiveFiltersBarProps {
  isVisible: boolean;
  onReset: () => void;
}

export function ActiveFiltersBar({ isVisible, onReset }: ActiveFiltersBarProps) {
  if (!isVisible) return null;

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2.5
        bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900
        rounded-md text-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
        <Filter className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="font-medium">Filtros activos</span>
        <span className="text-blue-500 dark:text-blue-400">
          — algunos resultados pueden estar ocultos
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="min-h-[44px] text-blue-700 dark:text-blue-300 hover:text-blue-800 shrink-0"
      >
        <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
        Restablecer todo
      </Button>
    </div>
  );
}
