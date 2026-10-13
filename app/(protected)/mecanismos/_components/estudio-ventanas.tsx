'use client';

import { Ban, Undo2 } from 'lucide-react';
import type {
  IEstudioAvanceDistrito,
  IEstudioRevisionConsejo,
} from '@/types/mecanismos';
import { getFirstBackendError } from '@/lib/helpers';
import {
  useAnularEstudio,
  useRevocarRevisionEstudio,
} from '../_hooks/use-estudios';
import { nombreConsejo } from '../_lib/estatus';
import { DocumentosEstudioDialog } from './documentos-estudio-dialog';
import { EstudioHistorialDialog } from './estudio-historial-dialog';
import { MotivoDialog } from './motivo-dialog';
import { ProponerEstudioDialog } from './proponer-estudio-dialog';

/** Ventanas sobre un estudio; una sola abierta a la vez. */
export type TVentanaEstudio =
  | { tipo: 'proponer'; distrito: IEstudioAvanceDistrito | null }
  | { tipo: 'documentos'; distrito: IEstudioAvanceDistrito }
  | { tipo: 'aprobar'; distrito: IEstudioAvanceDistrito }
  | { tipo: 'anular'; distrito: IEstudioAvanceDistrito }
  | { tipo: 'revocar'; id: number; consejo: IEstudioRevisionConsejo }
  | { tipo: 'historial'; id: number }
  | null;

interface EstudioVentanasProps {
  ventana: TVentanaEstudio;
  onChange: (ventana: TVentanaEstudio) => void;
  /** Distritos del tablero, para elegir uno al proponer; vacío desde el consejo. */
  distritos?: IEstudioAvanceDistrito[];
  /** Oficina central con permiso de revocar la revisión de un consejo. */
  puedeRevocar?: boolean;
  /** Oficina central con permiso de proponer: reemplaza el PDF propuesto desde la ventana de documentos. */
  puedeReemplazar?: boolean;
}

/** Historial, revocación, documentos, propuesta, aprobación y anulación del estudio, montados una sola vez. */
export function EstudioVentanas({
  ventana,
  onChange,
  distritos = [],
  puedeRevocar = false,
  puedeReemplazar = false,
}: EstudioVentanasProps) {
  const anular = useAnularEstudio();
  const revocar = useRevocarRevisionEstudio();
  const cerrar = (v: boolean) => !v && onChange(null);

  const conArchivo =
    ventana?.tipo === 'proponer' || ventana?.tipo === 'aprobar';

  return (
    <>
      <EstudioHistorialDialog
        idEstudio={ventana?.tipo === 'historial' ? ventana.id : null}
        open={ventana?.tipo === 'historial'}
        onOpenChange={cerrar}
      />
      <DocumentosEstudioDialog
        distrito={ventana?.tipo === 'documentos' ? ventana.distrito : null}
        open={ventana?.tipo === 'documentos'}
        onOpenChange={cerrar}
        puedeReemplazar={puedeReemplazar}
      />
      <ProponerEstudioDialog
        distritos={distritos}
        distrito={conArchivo ? ventana.distrito : null}
        modo={conArchivo ? ventana.tipo : 'proponer'}
        open={conArchivo}
        onOpenChange={cerrar}
      />
      <MotivoDialog
        open={ventana?.tipo === 'anular'}
        onOpenChange={cerrar}
        titulo={`Anulación del estudio · ${ventana?.tipo === 'anular' ? ventana.distrito.df : ''}`}
        descripcion="El estudio se anula con las revisiones de sus consejos; el distrito podrá recibir un estudio nuevo. Lo capturado queda en el historial."
        accion="Anular estudio"
        icono={<Ban className="h-4 w-4" aria-hidden="true" />}
        pendiente={anular.isPending}
        onConfirmar={(motivo) => {
          if (ventana?.tipo !== 'anular' || !ventana.distrito.id) return;
          anular.mutate(
            { id: ventana.distrito.id, motivo },
            { onSuccess: () => onChange(null) },
          );
        }}
      />
      {puedeRevocar && (
        <MotivoDialog
          open={ventana?.tipo === 'revocar'}
          onOpenChange={(v) => !v && !revocar.isPending && onChange(null)}
          titulo="Revocación de la revisión"
          descripcion={
            ventana?.tipo === 'revocar'
              ? `${nombreConsejo(ventana.consejo.tipo_consejo, ventana.consejo.id_consejo, ventana.consejo.consejo)} vuelve a Sin revisar y podrá capturar de nuevo; se conservan sus observaciones. La revocación queda en el historial.`
              : ''
          }
          accion="Revocar revisión"
          icono={<Undo2 className="h-4 w-4" aria-hidden="true" />}
          pendiente={revocar.isPending}
          error={
            revocar.isError
              ? (getFirstBackendError(revocar.error) ?? null)
              : null
          }
          onConfirmar={(motivo) => {
            if (ventana?.tipo !== 'revocar') return;
            revocar.mutate(
              {
                id: ventana.id,
                payload: {
                  tipo_consejo: ventana.consejo.tipo_consejo,
                  id_consejo: ventana.consejo.id_consejo,
                  motivo,
                },
              },
              { onSuccess: () => onChange(null) },
            );
          }}
        />
      )}
    </>
  );
}
