'use client';

import { useState } from 'react';
import type { IActaResumen } from '@/types/material-electoral';
import { formatFechaHora } from '@/lib/fechas';
import { VisorPdfDialog } from '@/components/common/visor-pdf-dialog';
import { useUrlFirmadaActa } from '../_hooks/use-actas';

/**
 * Visor del PDF firmado de un acta: `abrir` pide la URL firmada y `visor` es la
 * ventana lista para montar. Lo usan el listado del consejo y el de oficina central.
 */
export function useVisorActaFirmada() {
  const urlFirmada = useUrlFirmadaActa();
  const [acta, setActa] = useState<IActaResumen | null>(null);

  function abrir(a: IActaResumen) {
    setActa(a);
    urlFirmada.mutate(a.id);
  }

  const visor = (
    <VisorPdfDialog
      open={acta != null && !urlFirmada.isError}
      onOpenChange={(v) => !v && setActa(null)}
      titulo="Acta circunstanciada firmada"
      descripcion={
        acta?.fecha_firmado
          ? `PDF recibido ${formatFechaHora(acta.fecha_firmado)}`
          : undefined
      }
      url={urlFirmada.isSuccess ? urlFirmada.data : null}
      cargando={urlFirmada.isPending}
    />
  );

  return { abrir, visor };
}
