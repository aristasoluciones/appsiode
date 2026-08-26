'use client';

import { useState } from 'react';
import { ShieldOff, Smartphone, TriangleAlert } from 'lucide-react';
import {
  useDispositivosConfianza,
  useRetirarDispositivo,
  useRetirarDispositivos,
} from '../_hooks/use-seguridad';
import { useMfaEstado } from '../_hooks/use-mfa';
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
import type { IDispositivoConfianza } from '@/types/auth';

/**
 * Sección «Equipos de confianza» del perfil: computadoras donde se pidió
 * recordar el segundo paso —desde cuándo y hasta cuándo— con la opción de
 * retirarles la confianza, a una o a todas, para que vuelvan a pedir el código.
 */
export function DispositivosSeccion() {
  const {
    data: dispositivos,
    isLoading,
    isError,
    refetch,
  } = useDispositivosConfianza();
  const retirar = useRetirarDispositivo();
  const retirarTodos = useRetirarDispositivos();

  const [porRetirar, setPorRetirar] = useState<IDispositivoConfianza | null>(
    null,
  );
  const [retirarTodosAbierto, setRetirarTodosAbierto] = useState(false);

  const { data: estadoMfa } = useMfaEstado();

  const total = dispositivos?.length ?? 0;
  const ocupado = retirar.isPending || retirarTodos.isPending;

  // Sin segundo paso no hay equipos que recordar: la sección no aporta nada.
  if (!isLoading && !isError && total === 0 && estadoMfa && !estadoMfa.activo) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardHeading>
          <CardTitle>Equipos de confianza</CardTitle>
        </CardHeading>
        {total > 1 && (
          <CardToolbar>
            <Button
              variant="outline"
              size="sm"
              disabled={ocupado}
              onClick={() => setRetirarTodosAbierto(true)}
            >
              Retirar todos
            </Button>
          </CardToolbar>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Equipos en los que pidió recordar el segundo paso: durante el plazo
          indicado entran sin pedirle el código. Retire la confianza a los que ya
          no use o sean compartidos.
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
                No se pudieron consultar sus equipos de confianza.
              </AlertTitle>
            </Alert>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {!isLoading && !isError && total === 0 && (
          <p className="text-sm text-muted-foreground">
            No tiene equipos recordados: el segundo paso se le pedirá en cada
            inicio de sesión.
          </p>
        )}

        {!isLoading &&
          !isError &&
          (dispositivos ?? []).map((d) => (
            <div
              key={d.id_dispositivo}
              className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <Smartphone className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground break-all">
                      {d.dispositivo}
                    </span>
                    {d.actual && (
                      <Badge variant="success" appearance="light" size="sm">
                        Este equipo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Origen: {d.ip_origen || 'no registrado'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Recordado desde: {formatFechaHora(d.fecha_registro)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vence: {formatFechaHora(d.fecha_expira)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                title="Retirar la confianza a este equipo"
                aria-label="Retirar la confianza a este equipo"
                disabled={ocupado}
                onClick={() => setPorRetirar(d)}
              >
                <ShieldOff className="h-4 w-4" />
              </Button>
            </div>
          ))}
      </CardContent>

      <AlertDialog
        open={porRetirar !== null}
        onOpenChange={(v) => {
          if (!v) setPorRetirar(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Retirar la confianza al equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              {porRetirar?.actual
                ? 'Este es el equipo que está usando: la próxima vez que inicie sesión aquí volverá a pedirle el código del segundo paso.'
                : `«${porRetirar?.dispositivo}» volverá a pedir el código del segundo paso en su próximo inicio de sesión.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (porRetirar) retirar.mutate(porRetirar.id_dispositivo);
                setPorRetirar(null);
              }}
            >
              Retirar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={retirarTodosAbierto}
        onOpenChange={setRetirarTodosAbierto}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Retirar la confianza a todos los equipos?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ninguno de sus {total} equipos recordados volverá a entrar sin el
              código: el segundo paso se pedirá en todos, incluido este.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                retirarTodos.mutate();
                setRetirarTodosAbierto(false);
              }}
            >
              Retirar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
