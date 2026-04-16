'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import axios from 'axios';
import apiClient from '@/lib/api/axios-client';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
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

    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);

      const values = form.getValues();
      await apiClient.post('/Auth/recuperar-contrasenia', values);

      setSuccess('Enlace enviado exitosamente');
      form.reset();
      // Limpiar el mensaje de éxito después de unos segundos para re-habilitar el formulario
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setError(err.response.data.message || 'Error al enviar el enlace');
      } else {
        setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setIsProcessing(false);
    }
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
