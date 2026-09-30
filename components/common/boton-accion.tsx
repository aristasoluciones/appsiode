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

/**
 * Botón de icono para la columna de acciones de una tabla, con su tooltip.
 * Deshabilitado, el tooltip se ancla a un envoltorio para que siga
 * explicando por qué no está disponible.
 */
export function BotonAccion({
  etiqueta,
  onClick,
  disabled,
  className,
  children,
}: BotonAccionProps) {
  const boton = (
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
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {disabled ? (
          <span className="inline-flex" tabIndex={0}>
            {boton}
          </span>
        ) : (
          boton
        )}
      </TooltipTrigger>
      <TooltipContent>{etiqueta}</TooltipContent>
    </Tooltip>
  );
}
