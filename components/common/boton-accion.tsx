'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BotonAccionProps {
  /** Nombre de la acción; va al tooltip y al aria-label. */
  etiqueta: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Botón de icono para la columna de acciones de una tabla, con su tooltip. */
export function BotonAccion({
  etiqueta,
  onClick,
  disabled,
  className,
  children,
}: BotonAccionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={etiqueta}
          onClick={onClick}
          disabled={disabled}
          className={className}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{etiqueta}</TooltipContent>
    </Tooltip>
  );
}
