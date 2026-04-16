'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import {
  ChangePasswordSchemaType,
  getChangePasswordSchema,
} from '../forms/change-password-schema';
import Link from 'next/link';

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;

  const [verifyingToken, setVerifyingToken] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] = useState(false);

  const form = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(getChangePasswordSchema()),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Watch password to show live validation indicators
  const newPasswordValue = form.watch('newPassword');
  const minLength = 8;
  const hasMinLength = (newPasswordValue || '').length >= minLength;
  const hasUpper = /[A-Z]/.test(newPasswordValue || '');
  const hasLower = /[a-z]/.test(newPasswordValue || '');
  const hasNumber = /\d/.test(newPasswordValue || '');
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPasswordValue || '');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setVerifyingToken(true);

        await apiClient.post('/Auth/reset-password-verify', { token });
        setIsValidToken(true);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.data) {
        setError(err.response.data.message || 'Error al enviar el enlace');
        } else {
          setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
        }
      } finally {
        setVerifyingToken(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setError('No se proporcionó un token válido. Por favor, verifica el enlace que recibiste por correo electrónico.');
    }
  }, [token]);

  async function onSubmit(values: ChangePasswordSchemaType) {
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.post('/Auth/reset-password', {
        token,
        password: values.newPassword,
        confirm_password: values.confirmPassword,
      });

        
      setSuccessMessage('La contraseña ha sido cambiada exitosamente. Redirigiendo al login...');
      setTimeout(() => router.push('/signin'), 3000);
     
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        setError(err.response.data.message || 'Error al enviar el enlace');
      } else {
        setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-4"
      >
        <div className="text-center space-y-1 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Restablecer contraseña
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tu nueva contraseña a continuación.
          </p>
        </div>

        {error && (
          <div className="text-center space-y-6">
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
          </div>
        )}

        {successMessage && (
          <Alert>
            <AlertIcon>
              <Check />
            </AlertIcon>
            <AlertTitle>{successMessage}</AlertTitle>
          </Alert>
        )}

        {verifyingToken && (
          <Alert>
            <AlertIcon>
              <LoaderCircleIcon className="size-4 animate-spin" />
            </AlertIcon>
            <AlertTitle>Verificando...</AlertTitle>
          </Alert>
        )}

        {isValidToken && !successMessage && !verifyingToken && (
          <>
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={passwordVisible ? 'text' : 'password'}
                        placeholder="Ingresa tu nueva contraseña"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      mode="icon"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute end-0 top-1/2 -translate-y-1/2 h-7 w-7 me-1.5 bg-transparent!"
                      aria-label={
                        passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                      }
                    >
                      {passwordVisible ? (
                        <EyeOff className="text-muted-foreground" />
                      ) : (
                        <Eye className="text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                  <div className="mt-2 text-sm">
                    <ul className="space-y-1">
                      <li className="flex items-center text-sm text-muted-foreground">
                        <Check className={`me-2 ${hasMinLength ? 'text-green-500' : 'opacity-30'}`} />
                        Mínimo {minLength} caracteres
                      </li>
                      <li className="flex items-center text-sm text-muted-foreground">
                        <Check className={`me-2 ${hasUpper ? 'text-green-500' : 'opacity-30'}`} />
                        Al menos una letra mayúscula
                      </li>
                      <li className="flex items-center text-sm text-muted-foreground">
                        <Check className={`me-2 ${hasLower ? 'text-green-500' : 'opacity-30'}`} />
                        Al menos una letra minúscula
                      </li>
                      <li className="flex items-center text-sm text-muted-foreground">
                        <Check className={`me-2 ${hasNumber ? 'text-green-500' : 'opacity-30'}`} />
                        Al menos un número
                      </li>
                      <li className="flex items-center text-sm text-muted-foreground">
                        <Check className={`me-2 ${hasSpecial ? 'text-green-500' : 'opacity-30'}`} />
                        Al menos un carácter especial
                      </li>
                    </ul>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nueva contraseña</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={passwordConfirmationVisible ? 'text' : 'password'}
                        placeholder="Confirma tu nueva contraseña"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      mode="icon"
                      onClick={() =>
                        setPasswordConfirmationVisible(
                          !passwordConfirmationVisible,
                        )
                      }
                      className="absolute end-0 top-1/2 -translate-y-1/2 h-7 w-7 me-1.5 bg-transparent!"
                      aria-label={
                        passwordConfirmationVisible
                          ? 'Ocultar confirmación de contraseña'
                          : 'Mostrar confirmación de contraseña'
                      }
                    >
                      {passwordConfirmationVisible ? (
                        <EyeOff className="text-muted-foreground" />
                      ) : (
                        <Eye className="text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isProcessing} className="w-full">
              {isProcessing && <LoaderCircleIcon className="size-4 animate-spin" />}
              Restablecer contraseña
            </Button>
          </>
        )}
      </form>
    </Form>
  );
}
