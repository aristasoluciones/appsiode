'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TAMANOS_PAGINA = [10, 20, 30, 50, 100, 200];

interface PaginacionSimpleProps {
  pagina: number;
  totalPaginas: number;
  onPaginaChange: (pagina: number) => void;
  totalRegistros: number;
  tamano: number;
  onTamanoChange: (tamano: number) => void;
  /** Nombre de lo que se cuenta, en singular: «consejo», «mecanismo». */
  unidad?: string;
}

/** Pie de paginado local para listas armadas a mano (no DataGrid): tamaño de página y anterior/siguiente. */
export function PaginacionSimple({
  pagina,
  totalPaginas,
  onPaginaChange,
  totalRegistros,
  tamano,
  onTamanoChange,
  unidad = 'registro',
}: PaginacionSimpleProps) {
  if (totalPaginas <= 1 && totalRegistros <= TAMANOS_PAGINA[0]) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {totalRegistros} {unidad}
          {totalRegistros === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[0.6875rem] text-muted-foreground">
            Mostrar
          </span>
          <select
            value={tamano}
            onChange={(e) => onTamanoChange(Number(e.target.value))}
            className="h-7 rounded border border-input bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Registros por página"
          >
            {TAMANOS_PAGINA.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      {totalPaginas > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPaginaChange(pagina - 1)}
            disabled={pagina === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
            {pagina} / {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPaginaChange(pagina + 1)}
            disabled={pagina === totalPaginas}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
