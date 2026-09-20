'use client';

import { useState } from 'react';
import { Ban } from 'lucide-react';
import type { IEstudioAvanceDistrito } from '@/types/mecanismos';
import { VisorPdfDialog } from '@/components/common/visor-pdf-dialog';
import {
  useAnularEstudio,
  useUrlDocumentoEstudio,
} from '../_hooks/use-estudios';
import { AcusarEstudioDialog } from './acusar-estudio-dialog';
import type { TCualDocumento } from './estudio-card';
import { EstudioDetalleDialog } from './estudio-detalle-dialog';
import { MotivoDialog } from './motivo-dialog';
import { ProponerEstudioDialog } from './proponer-estudio-dialog';

/** Ventanas sobre un estudio; una sola abierta a la vez. */
export type TVentanaEstudio =
  | { tipo: 'detalle'; id: number }
  | { tipo: 'acusar'; id: number; df: string; etapa: 1 | 2 }
  | { tipo: 'proponer'; distrito: IEstudioAvanceDistrito | null }
  | { tipo: 'reemplazar'; distrito: IEstudioAvanceDistrito }
  | { tipo: 'aprobar'; distrito: IEstudioAvanceDistrito }
  | { tipo: 'anular'; distrito: IEstudioAvanceDistrito }
  | null;

interface EstudioVentanasProps {
  ventana: TVentanaEstudio;
  onChange: (ventana: TVentanaEstudio) => void;
  /** Distritos del tablero, para elegir uno al proponer; vacío desde el consejo. */
  distritos?: IEstudioAvanceDistrito[];
}

/** Detalle, acuse, propuesta, aprobación y anulación del estudio, montados una sola vez. */
export function EstudioVentanas({
  ventana,
  onChange,
  distritos = [],
}: EstudioVentanasProps) {
  const anular = useAnularEstudio();
  const cerrar = (v: boolean) => !v && onChange(null);

  const conArchivo =
    ventana?.tipo === 'proponer' ||
    ventana?.tipo === 'reemplazar' ||
    ventana?.tipo === 'aprobar';

  return (
    <>
      <EstudioDetalleDialog
        idEstudio={ventana?.tipo === 'detalle' ? ventana.id : null}
        open={ventana?.tipo === 'detalle'}
        onOpenChange={cerrar}
      />
      <AcusarEstudioDialog
        objetivo={ventana?.tipo === 'acusar' ? ventana : null}
        open={ventana?.tipo === 'acusar'}
        onOpenChange={cerrar}
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
        titulo={`Anular estudio · ${ventana?.tipo === 'anular' ? ventana.distrito.df : ''}`}
        descripcion="El estudio se anula con sus acuses; el distrito podrá recibir un estudio nuevo. Lo capturado queda en el historial."
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
    </>
  );
}

/**
 * Visor del PDF propuesto o aprobado de un estudio: `abrir` pide la URL firmada
 * y `visor` es la ventana lista para montar. Lo usan el consejo y el tablero.
 */
export function useVisorEstudio() {
  const urlDocumento = useUrlDocumentoEstudio();
  const [abierto, setAbierto] = useState<{
    id: number;
    df: string;
    cual: TCualDocumento;
  } | null>(null);

  function abrir(id: number, df: string, cual: TCualDocumento) {
    setAbierto({ id, df, cual });
    urlDocumento.mutate({ id, cual });
  }

  const visor = (
    <VisorPdfDialog
      open={abierto != null && !urlDocumento.isError}
      onOpenChange={(v) => !v && setAbierto(null)}
      titulo={
        abierto
          ? `Estudio ${abierto.cual === 'propuesta' ? 'propuesto' : 'aprobado'} · ${abierto.df}`
          : 'Estudio'
      }
      url={urlDocumento.isSuccess ? urlDocumento.data : null}
      cargando={urlDocumento.isPending}
    />
  );

  return {
    abrir,
    visor,
    pendiente:
      urlDocumento.isPending && abierto
        ? { id: abierto.id, cual: abierto.cual }
        : null,
  };
}
