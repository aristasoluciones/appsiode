'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import {
  AlertCircle,
  LoaderCircleIcon,
  MailCheck,
  Smartphone,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/providers/auth-provider';
import { useCuentaRegresiva } from '@/hooks/use-cuenta-regresiva';
import type { IBloqueoIntentos } from '@/lib/api/rate-limit';
import type { IMfaReto } from '@/types/auth';
import { AvisoBloqueo } from './aviso-bloqueo';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { getMfaSchema, MfaSchemaType } from '../forms/mfa-schema';

/**
 * Días que dura la confianza de un equipo recordado. Es el plazo de omisión del
 * API (`Mfa:TrustedDeviceDays`) y aquí solo sirve para redactar el aviso.
 */
const DIAS_CONFIANZA = 30;

interface PasoMfaProps {
  /** Reto temporal y método que devolvió el login. */
  mfa: IMfaReto;
  /** Regresa a la captura de credenciales (el reto venció o el usuario desiste). */
  onVolver: () => void;
}

/**
 * Segundo paso del inicio de sesión: canjea el reto del login con el código de
 * la app autenticadora, el del correo o un código de respaldo.
 */
export function PasoMfa({ mfa, onVolver }: PasoMfaProps) {
  const { loginMfa } = useAuth();
  const [usarRespaldo, setUsarRespaldo] = useState(false);
  const [recordarDispositivo, setRecordarDispositivo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retoInvalido, setRetoInvalido] = useState(false);
  const [bloqueo, setBloqueo] = useState<IBloqueoIntentos | null>(null);

  const esperaRestante = useCuentaRegresiva(bloqueo?.hasta ?? null);
  const estaBloqueado = esperaRestante > 0;

  const form = useForm<MfaSchemaType>({
    resolver: zodResolver(getMfaSchema(usarRespaldo)),
    defaultValues: { codigo: '' },
  });

  function cambiarModo(respaldo: boolean) {
    setUsarRespaldo(respaldo);
    setError(null);
    form.reset({ codigo: '' });
  }

  async function onSubmit(values: MfaSchemaType) {
    if (estaBloqueado || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const codigo = usarRespaldo
        ? values.codigo.trim().toUpperCase()
        : values.codigo;
      const result = await loginMfa(mfa.reto, codigo, recordarDispositivo);

      if (result.success) {
        // La sesión ya quedó emitida; recarga completa como en el login normal.
        window.location.replace('/');
        return;
      }

      if (result.bloqueo) setBloqueo(result.bloqueo);
      else setError(result.message || 'No se pudo verificar el código');
      if (result.retoInvalido) setRetoInvalido(true);
      form.reset({ codigo: '' });
    } catch {
      setError('Ocurrió un error inesperado. Intente de nuevo.');
    }

    setIsProcessing(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
      >
        <div className="space-y-1.5 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            Verificación en dos pasos
          </h1>
        </div>

        <Alert size="sm" close={false}>
          <AlertIcon>
            {mfa.metodo === 'correo' ? (
              <MailCheck className="text-primary" />
            ) : (
              <Smartphone className="text-primary" />
            )}
          </AlertIcon>
          <AlertTitle className="text-accent-foreground">
            {mfa.metodo === 'correo'
              ? 'Enviamos un código de 6 dígitos a su correo electrónico. Es válido por 5 minutos.'
              : usarRespaldo
                ? 'Capture uno de los códigos de respaldo que guardó al activar el segundo paso.'
                : 'Ingrese el código de 6 dígitos de su aplicación autenticadora.'}
          </AlertTitle>
        </Alert>

        {estaBloqueado && bloqueo && (
          <AvisoBloqueo mensaje={bloqueo.mensaje} restante={esperaRestante} />
        )}

        {error && !estaBloqueado && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {retoInvalido ? (
          <div className="flex flex-col gap-2.5">
            <Button variant="primary" type="button" onClick={onVolver}>
              Volver a iniciar sesión
            </Button>
          </div>
        ) : (
          <>
            {/* Va antes del código a propósito: al completar los 6 dígitos el
                formulario se envía solo y ya no habría oportunidad de marcarla. */}
            <div className="flex items-start gap-2.5 rounded-lg border border-input p-3">
              <Checkbox
                id="recordar-dispositivo"
                className="mt-0.5"
                checked={recordarDispositivo}
                onCheckedChange={(valor) =>
                  setRecordarDispositivo(valor === true)
                }
                disabled={estaBloqueado || isProcessing}
              />
              <label
                htmlFor="recordar-dispositivo"
                className="cursor-pointer space-y-1"
              >
                <span className="block text-sm font-medium text-foreground">
                  Recordar este dispositivo
                </span>
                <span className="block text-xs text-muted-foreground">
                  Durante los próximos {DIAS_CONFIANZA} días no le pediremos el
                  código en esta computadora. No la marque en equipos
                  compartidos del consejo.
                </span>
              </label>
            </div>

            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    {usarRespaldo ? (
                      <Input
                        placeholder="XXXXX-XXXXX"
                        autoComplete="one-time-code"
                        autoFocus
                        maxLength={11}
                        disabled={estaBloqueado || isProcessing}
                        className="text-center tracking-widest uppercase"
                        {...field}
                      />
                    ) : (
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          pattern={REGEXP_ONLY_DIGITS}
                          autoFocus
                          disabled={estaBloqueado || isProcessing}
                          value={field.value}
                          onChange={field.onChange}
                          onComplete={() => form.handleSubmit(onSubmit)()}
                        >
                          <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot
                                key={i}
                                index={i}
                                className="h-11 w-11 text-base"
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    )}
                  </FormControl>
                  <FormMessage className="text-center" />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2.5">
              <Button
                variant="primary"
                type="submit"
                disabled={isProcessing || estaBloqueado}
              >
                {isProcessing ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : null}
                Verificar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onVolver}
                disabled={isProcessing}
              >
                Volver
              </Button>
            </div>

            {mfa.metodo === 'app' && (
              <p className="text-center text-sm text-muted-foreground">
                {usarRespaldo ? (
                  <>
                    ¿Recuperó su aplicación?{' '}
                    <button
                      type="button"
                      onClick={() => cambiarModo(false)}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      Usar el código de la app
                    </button>
                  </>
                ) : (
                  <>
                    ¿No tiene acceso a su aplicación?{' '}
                    <button
                      type="button"
                      onClick={() => cambiarModo(true)}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      Usar un código de respaldo
                    </button>
                  </>
                )}
              </p>
            )}
          </>
        )}
      </form>
    </Form>
  );
}
