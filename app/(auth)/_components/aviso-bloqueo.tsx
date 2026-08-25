'use client';

import { TimerReset } from 'lucide-react';
import { formatoRestante } from '@/lib/api/rate-limit';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/components/ui/alert';

interface AvisoBloqueoProps {
  /** Motivo que devolvió el API al cortar los intentos. */
  mensaje: string;
  /** Segundos que faltan para poder reintentar. */
  restante: number;
}

/**
 * Aviso del bloqueo temporal por demasiados intentos, con la cuenta regresiva
 * de lo que falta para poder reintentar. La cuenta la lleva la pantalla con
 * `useCuentaRegresiva`, que es la que además deshabilita el formulario.
 */
export function AvisoBloqueo({ mensaje, restante }: AvisoBloqueoProps) {
  return (
    <Alert variant="warning" close={false}>
      <AlertIcon>
        <TimerReset />
      </AlertIcon>
      <AlertContent>
        <AlertTitle>{mensaje}</AlertTitle>
        <AlertDescription>
          Podrás intentarlo de nuevo en{' '}
          <span className="font-semibold tabular-nums">
            {formatoRestante(restante)}
          </span>
          .
        </AlertDescription>
      </AlertContent>
    </Alert>
  );
}
