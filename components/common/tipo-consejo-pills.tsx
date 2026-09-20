'use client';

import { Building2, MapPin } from 'lucide-react';
import type { IProceso } from '@/types/proceso';

export interface ITipoConsejoOpcion {
  value: 'D' | 'M';
  label: string;
}

const ICONO = { D: Building2, M: MapPin } as const;

/**
 * Tipos de consejo que trabaja el proceso activo, en el orden en que los
 * declaran sus elecciones; sin elecciones se usan las banderas del proceso.
 */
export function opcionesTipoConsejo(
  proceso: IProceso | null | undefined,
): ITipoConsejoOpcion[] {
  const vistos = new Map<'D' | 'M', string>();
  for (const eleccion of proceso?.elecciones ?? []) {
    if (!vistos.has(eleccion.consejo_tipo)) {
      vistos.set(eleccion.consejo_tipo, eleccion.consejo_tipo_text);
    }
  }
  if (vistos.size === 0) {
    if (proceso?.consejo_distrital) vistos.set('D', 'Distritales');
    if (proceso?.consejo_municipal) vistos.set('M', 'Municipales');
  }
  return Array.from(vistos, ([value, label]) => ({ value, label }));
}

interface TipoConsejoPillsProps {
  opciones: ITipoConsejoOpcion[];
  value: 'D' | 'M' | null;
  onChange: (value: 'D' | 'M') => void;
  disabled?: boolean;
}

/** Selector Distritales / Municipales de los tableros de oficina central. Con una sola opción no se dibuja. */
export function TipoConsejoPills({
  opciones,
  value,
  onChange,
  disabled,
}: TipoConsejoPillsProps) {
  if (opciones.length <= 1) return null;

  return (
    <div
      role="radiogroup"
      aria-label="Tipo de consejo"
      className="flex flex-wrap gap-2"
    >
      {opciones.map((op) => {
        const activo = value === op.value;
        const Icono = ICONO[op.value];
        return (
          <button
            key={op.value}
            type="button"
            role="radio"
            aria-checked={activo}
            disabled={disabled}
            onClick={() => onChange(op.value)}
            className={[
              'inline-flex items-center gap-2 h-8.5 px-3 rounded-md border text-[0.8125rem] font-medium',
              'transition-colors duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              activo
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-input text-foreground hover:bg-accent',
            ].join(' ')}
          >
            <Icono className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{op.label}</span>
          </button>
        );
      })}
    </div>
  );
}
