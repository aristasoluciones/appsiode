'use client';

import { MessageSquareText, Pencil, Power } from 'lucide-react';
import type { IMecanismo } from '@/types/mecanismos';
import { Button } from '@/components/ui/button';
import { EstatusMecanismoDialog } from './estatus-mecanismo-dialog';
import { MecanismoDetalleDialog } from './mecanismo-detalle-dialog';
import { MecanismoFormDialog } from './mecanismo-form-dialog';
import { ObservacionesMecanismoDialog } from './observaciones-mecanismo-dialog';

/** Ventanas sobre un mecanismo; una sola abierta a la vez. */
export type TVentanaMecanismo =
  | { tipo: 'detalle'; id: number }
  | { tipo: 'nuevo' }
  | { tipo: 'editar'; id: number }
  | { tipo: 'observaciones'; mecanismo: IMecanismo }
  | { tipo: 'estatus'; mecanismo: IMecanismo }
  | null;

interface MecanismoVentanasProps {
  ventana: TVentanaMecanismo;
  onChange: (ventana: TVentanaMecanismo) => void;
  /** Oficina central con permiso: el detalle ofrece editar, observaciones y estatus. */
  puedeAdministrar: boolean;
}

/**
 * Detalle, alta/edición, observaciones y estatus del mecanismo, montados una
 * sola vez por quien los use (el tablero de oficina central y la vista de un
 * consejo). Las acciones del detalle abren las demás ventanas.
 */
export function MecanismoVentanas({
  ventana,
  onChange,
  puedeAdministrar,
}: MecanismoVentanasProps) {
  const cerrar = (v: boolean) => !v && onChange(null);

  return (
    <>
      <MecanismoDetalleDialog
        idMecanismo={ventana?.tipo === 'detalle' ? ventana.id : null}
        open={ventana?.tipo === 'detalle'}
        onOpenChange={cerrar}
        acciones={
          puedeAdministrar
            ? (m) => (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onChange({ tipo: 'editar', id: m.id })}
                    disabled={!m.activo}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onChange({ tipo: 'observaciones', mecanismo: m })
                    }
                  >
                    <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                    Observaciones
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={m.activo ? 'text-destructive' : ''}
                    onClick={() => onChange({ tipo: 'estatus', mecanismo: m })}
                  >
                    <Power className="h-4 w-4" aria-hidden="true" />
                    {m.activo ? 'Dar de baja' : 'Reactivar'}
                  </Button>
                </>
              )
            : undefined
        }
      />

      {puedeAdministrar && (
        <>
          <MecanismoFormDialog
            idMecanismo={ventana?.tipo === 'editar' ? ventana.id : null}
            open={ventana?.tipo === 'nuevo' || ventana?.tipo === 'editar'}
            onOpenChange={cerrar}
          />
          <ObservacionesMecanismoDialog
            mecanismo={
              ventana?.tipo === 'observaciones' ? ventana.mecanismo : null
            }
            open={ventana?.tipo === 'observaciones'}
            onOpenChange={cerrar}
          />
          <EstatusMecanismoDialog
            mecanismo={ventana?.tipo === 'estatus' ? ventana.mecanismo : null}
            open={ventana?.tipo === 'estatus'}
            onOpenChange={cerrar}
          />
        </>
      )}
    </>
  );
}
