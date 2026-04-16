'use client';

import { CalendarDays } from 'lucide-react';
import { useProceso } from '@/hooks/use-proceso';
import { cn } from '@/lib/utils';

export function ProcesoSelector({ className }: { className?: string }) {
  const { data: proceso } = useProceso();

  if (!proceso) return null;

  const labelFull  = `PROCESO ELECTORAL  ${proceso.tipo}  ${proceso.anio}`;
  const labelShort = `${proceso.tipo} ${proceso.anio}`;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-md',
        'bg-primary/10 border border-primary/20',
        'text-[10px] md:text-xs font-semibold text-primary tracking-wide select-none',
        className,
      )}
      title={labelFull}
    >
      <CalendarDays className="size-3 md:size-3.5 shrink-0" />
      {/* label corto en móvil, completo desde md */}
      <span className="whitespace-nowrap md:hidden">{labelShort}</span>
      <span className="whitespace-nowrap hidden md:inline">{labelFull}</span>
    </div>
  );
}
