'use client';

import { useState } from 'react';
import { LogOut, Monitor, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import {
  useCerrarOtrasSesiones,
  useCerrarSesion,
  useSesionesActivas,
} from '../_hooks/use-seguridad';
import { formatFechaHora } from '@/lib/fechas';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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
import type { ISesionActiva } from '@/types/auth';

/**
 * Sección «Sesiones abiertas» del perfil: desde qué equipos está iniciada la
 * cuenta y desde cuándo, cuál es la sesión actual, y el cierre de una o de
 * todas las demás. Cerrar la actual equivale al cierre de sesión normal.
 */
export function SesionesSeccion() {
  const { data: sesiones, isLoading, isError, refetch } = useSesionesActivas();
  const cerrarSesion = useCerrarSesion();
  const cerrarOtras = useCerrarOtrasSesiones();
  const { logout } = useAuth();

  const [porCerrar, setPorCerrar] = useState<ISesionActiva | null>(null);
  const [cerrarTodasAbierto, setCerrarTodasAbierto] = useState(false);

  const otras = (sesiones ?? []).filter((s) => !s.actual);
  const ocupado = cerrarSesion.isPending || cerrarOtras.isPending;

  const confirmarCierre = async () => {
    if (!porCerrar) return;
    const eraActual = porCerrar.actual;
    const id = porCerrar.id_sesion;
    setPorCerrar(null);
    try {
      await cerrarSesion.mutateAsync({ idSesion: id, actual: eraActual });
      // La API ya borró las cookies de esta sesión: se completa el cierre en el
      // navegador para no quedar con una sesión revocada en pantalla.
      if (eraActual) await logout();
    } catch {
      /* el toast global ya avisó del fallo */
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Sesiones abiertas</CardTitle>
        </CardHeading>
        {otras.length > 0 && (
          <CardToolbar>
            <Button
              variant="outline"
              size="sm"
              disabled={ocupado}
              onClick={() => setCerrarTodasAbierto(true)}
            >
              Cerrar las demás
            </Button>
          </CardToolbar>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Equipos desde los que su cuenta tiene la sesión iniciada. Si no
          reconoce alguno, ciérrelo y cambie su contraseña.
        </p>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {isError && !isLoading && (
          <div className="space-y-3">
            <Alert variant="destructive" close={false}>
              <AlertIcon>
                <TriangleAlert />
              </AlertIcon>
              <AlertTitle>
                No se pudieron consultar sus sesiones abiertas.
              </AlertTitle>
            </Alert>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {!isLoading && !isError && (sesiones?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay sesiones abiertas registradas.
          </p>
        )}

        {!isLoading &&
          !isError &&
          (sesiones ?? []).map((s) => (
            <div
              key={s.id_sesion}
              className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <Monitor className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground break-all">
                      {s.dispositivo}
                    </span>
                    {s.actual && (
                      <Badge variant="success" appearance="light" size="sm">
                        Este equipo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Origen: {s.ip_origen || 'no registrado'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Inicio: {formatFechaHora(s.fecha_inicio)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Último uso: {formatFechaHora(s.fecha_ultimo_uso)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                title="Cerrar esta sesión"
                aria-label="Cerrar esta sesión"
                disabled={ocupado}
                onClick={() => setPorCerrar(s)}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ))}
      </CardContent>

      <AlertDialog
        open={porCerrar !== null}
        onOpenChange={(v) => {
          if (!v) setPorCerrar(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {porCerrar?.actual ? '¿Cerrar esta sesión?' : '¿Cerrar la sesión?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {porCerrar?.actual
                ? 'Es la sesión que está usando en este momento: se cerrará y volverá a la pantalla de inicio de sesión.'
                : `La sesión de «${porCerrar?.dispositivo}» dejará de tener acceso al sistema de inmediato y tendrá que iniciar sesión de nuevo.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmarCierre}>
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={cerrarTodasAbierto}
        onOpenChange={setCerrarTodasAbierto}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar las demás sesiones?</AlertDialogTitle>
            <AlertDialogDescription>
              Se cerrarán {otras.length}{' '}
              {otras.length === 1 ? 'sesión' : 'sesiones'} en otros equipos. La
              sesión que está usando ahora se conserva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                cerrarOtras.mutate();
                setCerrarTodasAbierto(false);
              }}
            >
              Cerrar las demás
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
