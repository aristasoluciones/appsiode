'use client';

import { HistorialCuenta } from '@/components/common/historial-cuenta';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsuarioSesionesPanel } from './usuario-sesiones-panel';
import type { IUsuario } from './usuarios-data';

interface Props {
  usuario: IUsuario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Permiso «Ver historial de la cuenta». */
  puedeVerHistorial: boolean;
  /** Permiso «Ver sesiones abiertas». */
  puedeVerSesiones: boolean;
  /** Permiso «Cerrar sesiones abiertas». */
  puedeRevocarSesiones: boolean;
}

/**
 * Detalle de una cuenta desde la pantalla de Usuarios, con dos apartados:
 * el historial de lo que ha pasado con ella y las sesiones que tiene abiertas,
 * con su cierre. Cada apartado se muestra solo a quien tiene su permiso.
 */
export function UsuarioDetalleDialog({
  usuario,
  open,
  onOpenChange,
  puedeVerHistorial,
  puedeVerSesiones,
  puedeRevocarSesiones,
}: Props) {
  if (!usuario) return null;

  const nombre = `${usuario.nombre} ${usuario.paterno} ${usuario.materno}`.trim();
  const pestaniaInicial = puedeVerHistorial ? 'historial' : 'sesiones';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{nombre || usuario.usuario}</DialogTitle>
          <DialogDescription>{usuario.usuario}</DialogDescription>
        </DialogHeader>

        <Tabs key={usuario.id} defaultValue={pestaniaInicial}>
          <TabsList variant="line">
            {puedeVerHistorial && (
              <TabsTrigger value="historial">Historial</TabsTrigger>
            )}
            {puedeVerSesiones && (
              <TabsTrigger value="sesiones">Sesiones abiertas</TabsTrigger>
            )}
          </TabsList>

          {puedeVerHistorial && (
            <TabsContent value="historial">
              {/* La consulta arranca al abrir el detalle, no al montar la tabla. */}
              <HistorialCuenta
                idUsuario={usuario.id}
                enabled={open}
                className="pt-5"
              />
            </TabsContent>
          )}

          {puedeVerSesiones && (
            <TabsContent value="sesiones" className="pt-5">
              <UsuarioSesionesPanel
                idUsuario={usuario.id}
                nombreUsuario={nombre || usuario.usuario}
                puedeRevocar={puedeRevocarSesiones}
                enabled={open}
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
