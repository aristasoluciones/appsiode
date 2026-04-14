import axios from 'axios';
import {
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  RiInformationFill,
} from '@remixicon/react';
import { toast as sonner } from 'sonner';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';

type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

const POSITION: ToastPosition = 'top-right';

export function toastSuccess(message: string) {
  sonner.custom(
    () => (
      <Alert variant="success" icon="success" appearance="light">
        <AlertIcon>
          <RiCheckboxCircleFill />
        </AlertIcon>
        <AlertContent>
          <AlertTitle>Éxito</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </AlertContent>
      </Alert>
    ),
    { position: POSITION },
  );
}

export function toastError(message: string) {
  sonner.custom(
    () => (
      <Alert variant="destructive" icon="destructive" appearance="light">
        <AlertIcon>
          <RiErrorWarningFill />
        </AlertIcon>
        <AlertContent>
          <AlertTitle>Ha ocurrido un error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </AlertContent>
      </Alert>
    ),
    { position: POSITION },
  );
}

export function toastWarning(message: string) {
  sonner.custom(
    () => (
      <Alert variant="warning" icon="warning" appearance="light">
        <AlertIcon>
          <RiInformationFill />
        </AlertIcon>
        <AlertContent>
          <AlertTitle>Advertencia</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </AlertContent>
      </Alert>
    ),
    { position: POSITION },
  );
}

export function toastInfo(message: string) {
  sonner.custom(
    () => (
      <Alert variant="info" icon="info" appearance="light">
        <AlertIcon>
          <RiInformationFill />
        </AlertIcon>
        <AlertContent>
          <AlertTitle>Información</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </AlertContent>
      </Alert>
    ),
    { position: POSITION },
  );
}

export function toastAxiosError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message: string = error.response?.data?.message ?? error.message ?? 'Error en la solicitud.';
    toastError(message);
  } else if (error instanceof Error) {
    toastError(error.message);
  } else {
    toastError('Ocurrió un error inesperado. Intenta nuevamente.');
  }
}
