'use client';

import { Circle } from 'lucide-react';
import { ESTADOS_CONFIG, type TEstadoIndicador } from './indicadores-data';

interface EstadoChipsProps {
  activos: Set<TEstadoIndicador>;
  conteos: Record<TEstadoIndicador, number>;
  onToggle: (estado: TEstadoIndicador) => void;
  disabled?: boolean;
}

const ESTADO_ICON_COLOR: Record<TEstadoIndicador, string> = {
  programada: 'text-violet-500',
  con_demora: 'text-red-500',
  en_proceso: 'text-yellow-500',
  concluida:  'text-green-500',
};

const ESTADOS_ORDEN: TEstadoIndicador[] = [
  'programada',
  'con_demora',
  'en_proceso',
  'concluida',
];

export function EstadoChips({
  activos,
  conteos,
  onToggle,
  disabled = false,
}: EstadoChipsProps) {
  return (
    <div
      role="group"
      aria-label="Filtrar por estado de sesión"
      className="flex flex-wrap gap-2"
    >
      {ESTADOS_ORDEN.map((estado) => {
        const cfg = ESTADOS_CONFIG[estado];
        const isActive = activos.has(estado);
        return (
          <button
            key={estado}
            role="checkbox"
            aria-checked={isActive}
            onClick={() => onToggle(estado)}
            disabled={disabled}
            className={[
              'inline-flex items-center gap-2 h-8.5 px-3 rounded-md border text-[0.8125rem] font-medium',
              'transition-colors duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isActive
                ? `${cfg.colorBg} ${cfg.colorBorder} ${cfg.colorText}`
                : 'bg-background border-input text-muted-foreground hover:bg-accent hover:text-foreground',
            ].join(' ')}
          >
            <Circle
              aria-hidden="true"
              className={`size-3.5 ${ESTADO_ICON_COLOR[estado]}`}
              fill="currentColor"
              stroke="none"
            />
            <span>{cfg.label}</span>
            <span
              className={[
                'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-sm text-xs font-semibold',
                isActive
                  ? `${cfg.colorBg} ${cfg.colorText}`
                  : 'bg-muted text-muted-foreground',
              ].join(' ')}
              aria-label={`${conteos[estado]} sesiones`}
            >
              {conteos[estado]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
