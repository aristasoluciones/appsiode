'use client';

import Image from 'next/image';
import { useEnlacesExternos } from '@/hooks/use-enlaces-externos';

interface PartidoLogoProps {
  /** Ruta relativa del logotipo en el RPP, tal como la guarda el acta. */
  imagen?: string | null;
  idPartido?: number | null;
  nombre?: string | null;
}

/**
 * Logotipo del partido de una representación, como en las aperturas de
 * bodega: la imagen del RPP y, si no la hay, un recuadro con el número del
 * partido.
 */
export function PartidoLogo({ imagen, idPartido, nombre }: PartidoLogoProps) {
  // El enlace al sistema RPP viaja en el proceso activo, no en el build.
  const { rppApiBase } = useEnlacesExternos();

  if (imagen && rppApiBase) {
    return (
      <div className="relative shrink-0 w-7 h-7 rounded overflow-hidden">
        <Image
          src={`${rppApiBase}/${imagen}`}
          alt={nombre ? `Logotipo de ${nombre}` : `Partido ${idPartido ?? ''}`}
          fill
          className="object-contain"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className="shrink-0 w-7 h-7 rounded bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground"
      aria-hidden="true"
    >
      {idPartido ?? '—'}
    </div>
  );
}
