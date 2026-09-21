/** «120 / 2000» bajo un campo de texto con límite; se pone en rojo al llegar al tope. */
export function ContadorCaracteres({
  valor,
  max,
}: {
  valor: string;
  max: number;
}) {
  const n = valor.length;
  return (
    <p
      className={[
        'text-xs text-right tabular-nums',
        n >= max ? 'text-destructive' : 'text-muted-foreground',
      ].join(' ')}
      aria-live="polite"
    >
      {n} / {max}
    </p>
  );
}
