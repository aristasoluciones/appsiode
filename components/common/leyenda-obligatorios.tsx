/** Aviso al pie de un formulario: los campos marcados con asterisco son obligatorios. */
export function LeyendaObligatorios({ className }: { className?: string }) {
  return (
    <p className={['text-xs text-muted-foreground', className ?? ''].join(' ')}>
      Los campos marcados con <span className="text-destructive">*</span> son
      obligatorios.
    </p>
  );
}
