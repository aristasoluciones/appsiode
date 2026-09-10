'use client';

import { useState } from 'react';
import { ImageIcon, ImageOff } from 'lucide-react';
import type { IArticulo } from '@/types/material-electoral';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useArticuloImagen } from '../_hooks/use-articulos';

const TAMANO = {
  sm: 'h-10 w-10',
  lg: 'h-40 w-40',
} as const;

/**
 * Miniatura de la fotografía del artículo. Las URL firmadas se piden por
 * artículo solo cuando tiene fotografía; sin ella se muestra el aviso «Sin
 * fotografía». Al pulsar la miniatura se abre la fotografía completa.
 */
export function ArticuloMiniatura({
  articulo,
  tamano = 'sm',
  /** Con `false` no se puede abrir la fotografía completa (por ejemplo, dentro de un formulario). */
  ampliable = true,
}: {
  articulo: Pick<
    IArticulo,
    'id' | 'codigo' | 'descripcion' | 'imagen' | 'imagen_version'
  >;
  tamano?: keyof typeof TAMANO;
  ampliable?: boolean;
}) {
  const [abierta, setAbierta] = useState(false);
  const tieneFoto = !!articulo.imagen;
  const { data, isLoading, isError } = useArticuloImagen(
    articulo.id,
    articulo.imagen_version,
    tieneFoto,
  );

  const caja = `${TAMANO[tamano]} shrink-0 rounded-md border border-border bg-muted/40 overflow-hidden flex items-center justify-center`;

  if (!tieneFoto) {
    return (
      <div
        className={`${caja} text-muted-foreground`}
        title="Sin fotografía"
        aria-label="Sin fotografía"
      >
        <ImageOff className={tamano === 'sm' ? 'h-4 w-4' : 'h-8 w-8'} />
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className={`${TAMANO[tamano]} shrink-0 rounded-md`} />;
  }

  if (isError || !data?.miniatura) {
    return (
      <div
        className={`${caja} text-muted-foreground`}
        title="La fotografía no está disponible"
        aria-label="La fotografía no está disponible"
      >
        <ImageIcon className={tamano === 'sm' ? 'h-4 w-4' : 'h-8 w-8'} />
      </div>
    );
  }

  const alt = `Fotografía del artículo ${articulo.codigo}`;

  const imagen = (
    <img
      src={data.miniatura}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  );

  if (!ampliable) {
    return <div className={caja}>{imagen}</div>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className={`${caja} cursor-zoom-in focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30`}
        title="Ver la fotografía"
        aria-label={`Ver la fotografía del artículo ${articulo.codigo}`}
      >
        {imagen}
      </button>

      <Dialog open={abierta} onOpenChange={setAbierta}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{articulo.codigo}</DialogTitle>
            <DialogDescription>{articulo.descripcion}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center rounded-lg border border-border bg-muted/40 p-2 max-h-[70vh] overflow-hidden">
            <img
              src={data.imagen ?? data.miniatura}
              alt={alt}
              className="max-h-[66vh] w-auto max-w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
