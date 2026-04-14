'use client';

import { Building2, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { TTipoConsejo } from '@/hooks/use-proceso';

const ICON_MAP: Record<TTipoConsejo, React.ComponentType<{ className?: string }>> = {
  distrital: Building2,
  municipal: MapPin,
};

export interface TipoConsejoOpcion {
  value: TTipoConsejo;
  label: string;
}

interface TipoConsejoPillsProps {
  value: TTipoConsejo;
  onChange: (tipo: TTipoConsejo) => void;
  opciones: TipoConsejoOpcion[];
  isLoading?: boolean;
  disabled?: boolean;
}

export function TipoConsejoPills({
  value,
  onChange,
  opciones,
  isLoading = false,
  disabled = false,
}: TipoConsejoPillsProps) {
  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Skeleton className="h-8.5 w-36 rounded-md" />
        <Skeleton className="h-8.5 w-36 rounded-md" />
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Tipo de Consejo" className="flex flex-wrap gap-2">
      {opciones.map((op) => {
        const isActive = value === op.value;
        const Icon = ICON_MAP[op.value];
        return (
          <button
            key={op.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(op.value)}
            disabled={disabled}
            className={[
              'inline-flex items-center gap-2 h-8.5 px-3 rounded-md border text-[0.8125rem] font-medium',
              'transition-colors duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isActive
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-input text-foreground hover:bg-accent',
            ].join(' ')}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{op.label}</span>
          </button>
        );
      })}
    </div>
  );
}
