'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { getFirstBackendError } from '@/lib/helpers';
import { useSolicitarRecuperacion } from '../_hooks/use-recuperacion';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoaderCircleIcon } from 'lucide-react';
// reCAPTCHA removed per request

export default function Page() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { mutate: solicitarRecuperacion, isPending: isProcessing } =
    useSolicitarRecuperacion();
  // reCAPTCHA removed; no showRecaptcha state

  const formSchema = z.object({
    usuario: z.string().email({ message: 'Por favor, ingresa una dirección de correo electrónico válida.' }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usuario: '',
    },
  });

  // Single submit handler (no reCAPTCHA)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await form.trigger();
    if (!result) return;

    setError(null);
    setSuccess(null);

    solicitarRecuperacion(form.getValues(), {
      onSuccess: () => {
        setSuccess('Enlace enviado exitosamente');
        form.reset();
        // Limpiar el mensaje de éxito después de unos segundos para re-habilitar el formulario
        setTimeout(() => setSuccess(null), 5000);
      },
      onError: (err) => {
        setError(
          getFirstBackendError(err) ||
            'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
        );
      },
    });
  };

  return (
    <Suspense>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="block w-full space-y-5">
          <div className="text-center space-y-1 pb-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Recuperar contraseña
            </h1>
            <p className="text-sm text-muted-foreground">
              Ingresa el correo electrónico de tu cuenta para recibir un enlace de recuperación
            </p>
          </div>

          {error && (
            <Alert variant="destructive" onClose={() => setError(null)}>
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          {success && (
            <Alert onClose={() => setSuccess(null)}>
              <AlertIcon>
                <Check />
              </AlertIcon>
              <AlertTitle>{success}</AlertTitle>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="usuario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Ingresa tu correo electrónico"
                    disabled={!!success || isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={!!success || isProcessing}
            className="w-full"
          >
            {isProcessing ? <LoaderCircleIcon className="animate-spin" /> : null}
            Enviar
          </Button>

          <div className="space-y-3">
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link href="/signin">
                <ArrowLeft className="size-3.5" /> Regresar
              </Link>
            </Button>
          </div>
        </form>
      </Form>
    </Suspense>
  );
}
