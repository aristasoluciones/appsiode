'use client';

import Image from 'next/image';
import { esUrlHttp } from '@/lib/helpers';

interface PartidoLogoProps {
  /**
   * URL completa del logotipo, como la entrega el API. Las actas guardadas
   * antes de ese cambio traen una ruta relativa: sin URL se muestra el número.
   */
  imagen?: string | null;
  idPartido?: number | null;
  nombre?: string | null;
}

/**
 * Logotipo del partido de una representación: la imagen que entrega el API y,
 * si no la hay, un recuadro con el número del partido.
 */
export function PartidoLogo({ imagen, idPartido, nombre }: PartidoLogoProps) {
  if (esUrlHttp(imagen)) {
    return (
      <div className="relative shrink-0 w-7 h-7 rounded overflow-hidden">
        <Image
          src={imagen}
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
