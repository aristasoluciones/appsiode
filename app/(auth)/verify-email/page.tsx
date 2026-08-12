'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/dist/client/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoaderCircleIcon } from 'lucide-react';
import { getFirstBackendError } from '@/lib/helpers';
import { useVerificarCorreo } from '../_hooks/use-recuperacion';

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') ?? null;

  const { mutate: verificarCorreo, isPending, isSuccess, isError, error: errorApi } =
    useVerificarCorreo();

  useEffect(() => {
    if (token) verificarCorreo(token);
  }, [token, verificarCorreo]);

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => router.push('/signin'), 2000);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  const error = !token
    ? 'El enlace no incluye un token válido.'
    : isError
      ? getFirstBackendError(errorApi) || 'Ocurrió un error durante la verificación.'
      : null;

  const message = isPending
    ? 'Verificando...'
    : isSuccess
      ? '¡Tu correo electrónico fue verificado correctamente!'
      : null;

  return (
    <Suspense>
      <div className="w-full space-y-6">
        <h1 className="text-2x font-semibold">Verificación de correo electrónico</h1>
        {error && (
          <>
            <Alert variant="destructive">
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>

            <Button asChild>
              <Link href="/signin" className="text-primary">
                Volver al login
              </Link>
            </Button>
          </>
        )}

        {message && (
          <Alert>
            <AlertIcon>
              <LoaderCircleIcon className="size-4 animate-spin stroke-muted-foreground" />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        )}
      </div>
    </Suspense>
  );
}
