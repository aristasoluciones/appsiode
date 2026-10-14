'use client';

import { Container } from '@/components/common/container';
import { ErrorState } from '@/components/common/error-state';

/** Falla inesperada al mostrar el módulo: aviso y reintento sin salir de la página. */
export default function MecanismosError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container>
      <ErrorState
        title="No se pudo mostrar Mecanismos de Recolección."
        onRetry={reset}
      />
    </Container>
  );
}
