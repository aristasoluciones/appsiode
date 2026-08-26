'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  LoaderCircleIcon,
  TriangleAlert,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { toastSuccess } from '@/lib/toast';
import { useMfaConfirmar, useMfaEnrolar } from '../_hooks/use-mfa';
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

type TPaso = 'qr' | 'confirmar' | 'respaldo';

interface MfaActivarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function mensajeDeError(error: unknown, fallback: string): string {
  const message = axios.isAxiosError(error)
    ? (error.response?.data?.message as string | undefined)
    : undefined;
  return message || fallback;
}

/**
 * Asistente de activación del segundo paso: genera el enrolamiento y muestra el
 * código QR, confirma con el primer código válido de la app y entrega los
 * códigos de respaldo, que se muestran una sola vez.
 */
export function MfaActivarDialog({ open, onOpenChange }: MfaActivarDialogProps) {
  const enrolar = useMfaEnrolar();
  const confirmar = useMfaConfirmar();
  const [paso, setPaso] = useState<TPaso>('qr');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [codigosRespaldo, setCodigosRespaldo] = useState<string[]>([]);
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const copiaSecreto = useCopyToClipboard();

  const { mutate: generarEnrolamiento } = enrolar;

  useEffect(() => {
    if (!open) return;
    setPaso('qr');
    setCodigo('');
    setError(null);
    setCodigosRespaldo([]);
    generarEnrolamiento(undefined, {
      onError: (err) =>
        setError(
          mensajeDeError(err, 'No se pudo generar el enrolamiento. Intente de nuevo.'),
        ),
    });
  }, [open, generarEnrolamiento]);

  function confirmarCodigo() {
    if (codigo.length !== 6 || confirmar.isPending) return;
    setError(null);
    confirmar.mutate(codigo, {
      onSuccess: (data) => {
        setCodigosRespaldo(data.codigosRespaldo ?? []);
        setPaso('respaldo');
        toastSuccess('La autenticación en dos pasos quedó activada.');
      },
      onError: (err) => {
        setError(mensajeDeError(err, 'No se pudo confirmar el código.'));
        setCodigo('');
      },
    });
  }

  function descargarRespaldo() {
    const contenido = [
      'SIODE — Códigos de respaldo de la autenticación en dos pasos',
      'Cada código funciona una sola vez. Guárdelos en un lugar seguro.',
      '',
      ...codigosRespaldo,
    ].join('\r\n');
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'siode-codigos-respaldo.txt';
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Activar la autenticación en dos pasos</DialogTitle>
          <DialogDescription>
            {paso === 'qr' &&
              'Paso 1 de 3: vincule su aplicación autenticadora.'}
            {paso === 'confirmar' &&
              'Paso 2 de 3: confirme con el primer código de la app.'}
            {paso === 'respaldo' &&
              'Paso 3 de 3: guarde sus códigos de respaldo.'}
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

          {paso === 'qr' && (
            <>
              <p className="text-sm text-muted-foreground">
                Escanee este código QR con su aplicación autenticadora (Google
                Authenticator, Microsoft Authenticator o similar).
              </p>
              <div className="flex justify-center">
                {enrolar.isPending && (
                  <div className="flex h-[196px] items-center justify-center">
                    <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {enrolar.data && (
                  <div className="rounded-lg bg-white p-2 border border-border">
                    <QRCodeSVG value={enrolar.data.otpauthUri} size={180} />
                  </div>
                )}
              </div>
              {enrolar.data && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    Si no puede escanearlo, capture esta clave a mano en la app:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="grow rounded-md bg-muted px-2.5 py-1.5 text-xs break-all">
                      {enrolar.data.secreto}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copiaSecreto.copyToClipboard(enrolar.data!.secreto)}
                      aria-label="Copiar la clave"
                    >
                      {copiaSecreto.isCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {paso === 'confirmar' && (
            <>
              <p className="text-sm text-muted-foreground">
                Ingrese el código de 6 dígitos que muestra la aplicación para
                comprobar que quedó bien vinculada.
              </p>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  pattern={REGEXP_ONLY_DIGITS}
                  autoFocus
                  value={codigo}
                  onChange={setCodigo}
                  onComplete={confirmarCodigo}
                  disabled={confirmar.isPending}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="h-11 w-11 text-base" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </>
          )}

          {paso === 'respaldo' && (
            <>
              <Alert variant="warning" close={false}>
                <AlertIcon>
                  <TriangleAlert />
                </AlertIcon>
                <AlertTitle>
                  Estos códigos se muestran una sola vez. Guárdelos en un lugar
                  seguro: cada uno permite entrar una vez si pierde el teléfono.
                </AlertTitle>
              </Alert>
              <div className="grid grid-cols-2 gap-2">
                {codigosRespaldo.map((c) => (
                  <code
                    key={c}
                    className="rounded-md bg-muted px-2.5 py-1.5 text-center text-sm tabular-nums"
                  >
                    {c}
                  </code>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(codigosRespaldo.join('\n'))}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copiar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={descargarRespaldo}
                >
                  <Download className="h-4 w-4" /> Descargar
                </Button>
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          {paso === 'qr' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  setError(null);
                  setPaso('confirmar');
                }}
                disabled={!enrolar.data}
              >
                Continuar
              </Button>
            </>
          )}
          {paso === 'confirmar' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  setCodigo('');
                  setPaso('qr');
                }}
                disabled={confirmar.isPending}
              >
                Regresar
              </Button>
              <Button
                onClick={confirmarCodigo}
                disabled={codigo.length !== 6 || confirmar.isPending}
              >
                {confirmar.isPending ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : null}
                Confirmar
              </Button>
            </>
          )}
          {paso === 'respaldo' && (
            <Button onClick={() => onOpenChange(false)}>
              Listo, los guardé
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
