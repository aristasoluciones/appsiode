'use client';

import { Ban } from 'lucide-react';
import type { ICedulaConsejo } from '@/types/mecanismos';
import { useAnularCedula } from '../_hooks/use-cedulas';
import { claveMecanismo } from '../_lib/estatus';
import { CedulaDetalleDialog } from './cedula-detalle-dialog';
import { CedulaObservacionesDialog } from './cedula-observaciones-dialog';
import { InformarCedulaDialog } from './informar-cedula-dialog';
import { MotivoDialog } from './motivo-dialog';
import { ProponerCedulaDialog } from './proponer-cedula-dialog';

/** Ventanas sobre una cédula; una sola abierta a la vez. */
export type TVentanaCedula =
  | { tipo: 'detalle'; id: number }
  | { tipo: 'informar'; cedula: ICedulaConsejo }
  | { tipo: 'acusar'; cedula: ICedulaConsejo }
  | { tipo: 'proponer'; cedula: ICedulaConsejo }
  | { tipo: 'reemplazar'; cedula: ICedulaConsejo }
  | { tipo: 'aprobar'; cedula: ICedulaConsejo }
  | { tipo: 'cerrar'; cedula: ICedulaConsejo }
  | { tipo: 'anular'; cedula: ICedulaConsejo }
  | null;

interface CedulaVentanasProps {
  ventana: TVentanaCedula;
  onChange: (ventana: TVentanaCedula) => void;
}

/** Detalle, informe, acuse, propuesta, aprobación, cierre y anulación, montados una sola vez. */
export function CedulaVentanas({ ventana, onChange }: CedulaVentanasProps) {
  const anular = useAnularCedula();
  const cerrar = (v: boolean) => !v && onChange(null);
  const cedula = ventana && 'cedula' in ventana ? ventana.cedula : null;

  return (
    <>
      <CedulaDetalleDialog
        idMecanismo={ventana?.tipo === 'detalle' ? ventana.id : null}
        open={ventana?.tipo === 'detalle'}
        onOpenChange={cerrar}
      />
      <InformarCedulaDialog
        cedula={ventana?.tipo === 'informar' ? ventana.cedula : null}
        open={ventana?.tipo === 'informar'}
        onOpenChange={cerrar}
      />
      <CedulaObservacionesDialog
        cedula={
          ventana?.tipo === 'acusar' || ventana?.tipo === 'cerrar'
            ? ventana.cedula
            : null
        }
        modo={ventana?.tipo === 'cerrar' ? 'cerrar' : 'acusar'}
        open={ventana?.tipo === 'acusar' || ventana?.tipo === 'cerrar'}
        onOpenChange={cerrar}
      />
      <ProponerCedulaDialog
        cedula={
          ventana?.tipo === 'proponer' ||
          ventana?.tipo === 'reemplazar' ||
          ventana?.tipo === 'aprobar'
            ? ventana.cedula
            : null
        }
        modo={
          ventana?.tipo === 'reemplazar'
            ? 'reemplazar'
            : ventana?.tipo === 'aprobar'
              ? 'aprobar'
              : 'proponer'
        }
        open={
          ventana?.tipo === 'proponer' ||
          ventana?.tipo === 'reemplazar' ||
          ventana?.tipo === 'aprobar'
        }
        onOpenChange={cerrar}
      />
      <MotivoDialog
        open={ventana?.tipo === 'anular'}
        onOpenChange={cerrar}
        titulo={`Anular cédula · ${cedula ? claveMecanismo(cedula) : ''}`}
        descripcion="La cédula se anula desde cualquier estatus, incluida la cerrada. El mecanismo podrá recibir una propuesta nueva; lo capturado queda en el historial."
        accion="Anular cédula"
        icono={<Ban className="h-4 w-4" aria-hidden="true" />}
        pendiente={anular.isPending}
        onConfirmar={(motivo) => {
          if (ventana?.tipo !== 'anular') return;
          anular.mutate(
            { id: ventana.cedula.id, motivo },
            { onSuccess: () => onChange(null) },
          );
        }}
      />
    </>
  );
}
