'use client';

import { useState } from 'react';
import { ShieldCheck, ShieldOff, TriangleAlert } from 'lucide-react';
import { useMfaEstado } from '../_hooks/use-mfa';
import {
  Alert,
  AlertIcon,
  AlertTitle,
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MfaActivarDialog } from './mfa-activar-dialog';
import { MfaDesactivarDialog } from './mfa-desactivar-dialog';

/**
 * Sección «Autenticación en dos pasos» del perfil: estado del segundo paso,
 * activación con la app autenticadora y desactivación con un código vigente.
 */
export function MfaSeccion() {
  const { data: estado, isLoading, isError, refetch } = useMfaEstado();
  const [activarAbierto, setActivarAbierto] = useState(false);
  const [desactivarAbierto, setDesactivarAbierto] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Autenticación en dos pasos</CardTitle>
        </CardHeading>
        {estado && (
          <CardToolbar>
            {estado.activo ? (
              <Badge variant="success" appearance="light">
                Activa
              </Badge>
            ) : (
              <Badge variant="secondary" appearance="light">
                Inactiva
              </Badge>
            )}
          </CardToolbar>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-32" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="space-y-3">
            <Alert variant="destructive" close={false}>
              <AlertIcon>
                <TriangleAlert />
              </AlertIcon>
              <AlertTitle>
                No se pudo consultar el estado del segundo paso.
              </AlertTitle>
            </Alert>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {estado && !estado.activo && (
          <>
            <p className="text-sm text-muted-foreground">
              Agregue una capa extra de seguridad a su cuenta: además de la
              contraseña, al iniciar sesión se pedirá un código de 6 dígitos
              generado por una aplicación autenticadora en su teléfono (Google
              Authenticator, Microsoft Authenticator o similar).
            </p>
            {estado.exigido && (
              <Alert variant="warning" close={false}>
                <AlertIcon>
                  <TriangleAlert />
                </AlertIcon>
                <AlertTitle>
                  La administración exige el segundo paso para su cuenta.
                  Mientras no lo active, al iniciar sesión recibirá el código
                  por correo electrónico.
                </AlertTitle>
              </Alert>
            )}
            <Button onClick={() => setActivarAbierto(true)}>
              <ShieldCheck className="h-4 w-4" /> Activar
            </Button>
          </>
        )}

        {estado?.activo && (
          <>
            <p className="text-sm text-muted-foreground">
              Su cuenta pide el código de la aplicación autenticadora en cada
              inicio de sesión.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Códigos de respaldo disponibles:
              </span>
              <span className="font-semibold tabular-nums">
                {estado.codigosRespaldoRestantes}
              </span>
            </div>
            {estado.codigosRespaldoRestantes === 0 && (
              <Alert variant="warning" close={false}>
                <AlertIcon>
                  <TriangleAlert />
                </AlertIcon>
                <AlertTitle>
                  Ya no le quedan códigos de respaldo. Si pierde el teléfono no
                  podrá entrar; contacte a la administración para resetear su
                  enrolamiento.
                </AlertTitle>
              </Alert>
            )}
            {estado.exigido && (
              <p className="text-xs text-muted-foreground">
                El segundo paso es obligatorio para su cuenta por disposición de
                la administración: si desactiva la aplicación, el código le
                llegará por correo electrónico al iniciar sesión.
              </p>
            )}
            <Button variant="outline" onClick={() => setDesactivarAbierto(true)}>
              <ShieldOff className="h-4 w-4" /> Desactivar
            </Button>
          </>
        )}
      </CardContent>

      <MfaActivarDialog
        open={activarAbierto}
        onOpenChange={setActivarAbierto}
      />
      <MfaDesactivarDialog
        open={desactivarAbierto}
        onOpenChange={setDesactivarAbierto}
      />
    </Card>
  );
}
