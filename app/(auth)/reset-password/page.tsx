'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCuentaRegresiva } from '@/hooks/use-cuenta-regresiva';
import { getBloqueoIntentos, type IBloqueoIntentos } from '@/lib/api/rate-limit';
import { useSolicitarRecuperacion } from '../_hooks/use-recuperacion';
import { AvisoBloqueo } from '../_components/aviso-bloqueo';
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

/**
 * Aviso único que ve el usuario tanto si el correo está registrado como si no.
 * Distinguir ambos casos permitiría averiguar qué cuentas existen.
 */
const MENSAJE_NEUTRO =
  'Si el correo está registrado, te enviaremos un enlace para restablecer la contraseña. Revisa tu bandeja de entrada y la carpeta de correo no deseado.';

/**
 * Solo se muestra como error la falla ajena al correo capturado: el servidor no
 * responde o falla. El corte por demasiados intentos tiene su propio aviso con
 * cuenta regresiva y cualquier otro rechazo se responde con el aviso neutro.
 */
function esFallaDelServicio(error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === undefined || status >= 500;
}

export default function Page() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bloqueo, setBloqueo] = useState<IBloqueoIntentos | null>(null);
  const { mutate: solicitarRecuperacion, isPending: isProcessing } =
    useSolicitarRecuperacion();

  // Mientras corra la espera del bloqueo el formulario queda deshabilitado.
  const esperaRestante = useCuentaRegresiva(bloqueo?.hasta ?? null);
  const estaBloqueado = esperaRestante > 0;
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

  const mostrarAvisoNeutro = () => {
    setSuccess(MENSAJE_NEUTRO);
    form.reset();
    // Limpiar el mensaje después de unos segundos para re-habilitar el formulario
    setTimeout(() => setSuccess(null), 8000);
  };

  // Single submit handler (no reCAPTCHA)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (estaBloqueado) return;

    const result = await form.trigger();
    if (!result) return;

    setError(null);
    setSuccess(null);

    solicitarRecuperacion(form.getValues(), {
      onSuccess: mostrarAvisoNeutro,
      onError: (err) => {
        // El límite de intentos se aplica igual exista o no la cuenta, así que
        // avisarlo no revela nada.
        const limite = getBloqueoIntentos(err);
        if (limite) {
          setBloqueo(limite);
          return;
        }

        if (esFallaDelServicio(err)) {
          setError(
            'No pudimos procesar tu solicitud en este momento. Por favor, inténtalo de nuevo más tarde.',
          );
          return;
        }

        mostrarAvisoNeutro();
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

          {estaBloqueado && bloqueo && (
            <AvisoBloqueo mensaje={bloqueo.mensaje} restante={esperaRestante} />
          )}

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
                    disabled={!!success || isProcessing || estaBloqueado}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={!!success || isProcessing || estaBloqueado}
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
