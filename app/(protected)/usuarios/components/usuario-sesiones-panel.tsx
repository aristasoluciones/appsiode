'use client';

import { useState } from 'react';
import { LogOut, Monitor, TriangleAlert } from 'lucide-react';
import { formatFechaHora } from '@/lib/fechas';
import {
  useCerrarSesionUsuario,
  useCerrarSesionesUsuario,
  useUsuarioSesiones,
} from './usuarios-sesiones-data';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { ISesionActiva } from '@/types/auth';

interface Props {
  idUsuario: number;
  /** Nombre de la cuenta, para explicar el efecto en las confirmaciones. */
  nombreUsuario: string;
  /** Quien consulta puede además cerrar sesiones de la cuenta. */
  puedeRevocar: boolean;
  enabled: boolean;
}

/**
 * Sesiones abiertas de una cuenta ajena, para el detalle de Usuarios: desde qué
 * equipos está iniciada, con su origen y su último uso, y el cierre de una o de
 * todas ante un incidente. Cada cierre queda registrado a nombre de quien lo hizo.
 */
export function UsuarioSesionesPanel({
  idUsuario,
  nombreUsuario,
  puedeRevocar,
  enabled,
}: Props) {
  const {
    data: sesiones,
    isLoading,
    isError,
    refetch,
  } = useUsuarioSesiones(idUsuario, enabled);
  const cerrarSesion = useCerrarSesionUsuario();
  const cerrarTodas = useCerrarSesionesUsuario();

  const [porCerrar, setPorCerrar] = useState<ISesionActiva | null>(null);
  const [cerrarTodasAbierto, setCerrarTodasAbierto] = useState(false);

  const lista = sesiones ?? [];
  const ocupado = cerrarSesion.isPending || cerrarTodas.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Equipos desde los que la cuenta tiene la sesión iniciada. Al cerrar una
          sesión, ese equipo pierde el acceso de inmediato y tendrá que iniciar
          sesión de nuevo.
        </p>
        {puedeRevocar && lista.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={ocupado}
            onClick={() => setCerrarTodasAbierto(true)}
          >
            Cerrar todas
          </Button>
        )}
      </div>

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
              No se pudieron consultar las sesiones de la cuenta.
            </AlertTitle>
          </Alert>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !isError && lista.length === 0 && (
        <p className="text-sm text-muted-foreground">
          La cuenta no tiene sesiones abiertas.
        </p>
      )}

      {!isLoading &&
        !isError &&
        lista.map((s) => (
          <div
            key={s.id_sesion}
            className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <Monitor className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
              <div className="min-w-0 space-y-1">
                <span className="text-sm font-medium text-foreground break-all">
                  {s.dispositivo}
                </span>
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
            {puedeRevocar && (
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
            )}
          </div>
        ))}

      <AlertDialog
        open={porCerrar !== null}
        onOpenChange={(v) => {
          if (!v) setPorCerrar(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar la sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              La sesión de «{porCerrar?.dispositivo}» de {nombreUsuario} dejará
              de tener acceso al sistema de inmediato y esa persona tendrá que
              iniciar sesión de nuevo. El cierre queda registrado a su nombre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (porCerrar)
                  cerrarSesion.mutate({
                    idUsuario,
                    idSesion: porCerrar.id_sesion,
                  });
                setPorCerrar(null);
              }}
            >
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
            <AlertDialogTitle>
              ¿Cerrar todas las sesiones de la cuenta?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se cerrarán {lista.length}{' '}
              {lista.length === 1 ? 'sesión' : 'sesiones'} de {nombreUsuario} en
              todos sus equipos, incluida la que esté usando en este momento.
              Tendrá que iniciar sesión de nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                cerrarTodas.mutate(idUsuario);
                setCerrarTodasAbierto(false);
              }}
            >
              Cerrar todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
