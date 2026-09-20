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
        'inline-flex items-center gap-1 h-8 px-2 rounded-md border text-xs font-medium whitespace-nowrap',
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
