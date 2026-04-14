'use client';

import { CalendarDays } from 'lucide-react';
import { useProceso } from '@/hooks/use-proceso';
import { cn } from '@/lib/utils';

export function ProcesoSelector({ className }: { className?: string }) {
  const { data: proceso } = useProceso();

  if (!proceso) return null;

  const label = `PROCESO ELECTORAL  ${proceso.tipo}  ${proceso.anio}`;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-md',
        'bg-primary/10 border border-primary/20',
        'text-xs font-semibold text-primary tracking-wide select-none',
        className,
      )}
      title={label}
    >
      <CalendarDays className="size-3.5 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}
