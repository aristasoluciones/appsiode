'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { AlertCircle, LoaderCircleIcon } from 'lucide-react';
import { toastSuccess } from '@/lib/toast';
import { useMfaDesactivar } from '../_hooks/use-mfa';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface MfaDesactivarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Desactiva el segundo paso presentando un código vigente de la app. */
export function MfaDesactivarDialog({
  open,
  onOpenChange,
}: MfaDesactivarDialogProps) {
  const desactivar = useMfaDesactivar();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCodigo('');
      setError(null);
    }
  }, [open]);

  function confirmarDesactivacion() {
    if (codigo.length !== 6 || desactivar.isPending) return;
    setError(null);
    desactivar.mutate(codigo, {
      onSuccess: () => {
        toastSuccess('La autenticación en dos pasos quedó desactivada.');
        onOpenChange(false);
      },
      onError: (err) => {
        const message = axios.isAxiosError(err)
          ? (err.response?.data?.message as string | undefined)
          : undefined;
        setError(message || 'No se pudo desactivar el segundo paso.');
        setCodigo('');
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Desactivar la autenticación en dos pasos</DialogTitle>
          <DialogDescription>
            Para confirmar, ingrese el código vigente de su aplicación
            autenticadora. Su cuenta volverá a entrar solo con la contraseña.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {error && (
            <Alert variant="destructive" close={false}>
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              autoFocus
              value={codigo}
              onChange={setCodigo}
              onComplete={confirmarDesactivacion}
              disabled={desactivar.isPending}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-11 w-11 text-base" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={desactivar.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={confirmarDesactivacion}
            disabled={codigo.length !== 6 || desactivar.isPending}
          >
            {desactivar.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : null}
            Desactivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
