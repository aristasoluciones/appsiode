'use client';

interface ChipFiltroProps {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

/** Chip conmutable para filtrar una lista en pantalla; suele llevar su conteo. */
export function ChipFiltro({
  activo,
  onClick,
  children,
  disabled,
}: ChipFiltroProps) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      disabled={disabled}
      onClick={onClick}
      className={[
        'group inline-flex items-center gap-1.5 h-8 px-2 rounded-md border text-xs font-medium whitespace-nowrap',
        'transition-colors duration-150 motion-reduce:transition-none',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:border-ring',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        activo
          ? 'bg-primary/10 border-primary text-primary'
          : 'bg-background border-input text-muted-foreground hover:bg-accent',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/**
 * Conteo del chip en un círculo, para que se lea como cantidad y no como parte
 * del texto. Toma el color primario cuando el chip está activo.
 */
export function ConteoChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-muted text-foreground text-[11px] font-semibold tabular-nums leading-none group-aria-pressed:bg-primary group-aria-pressed:text-primary-foreground">
      {children}
    </span>
  );
}
