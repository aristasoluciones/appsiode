'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FotoZoom } from './foto-zoom';

const TAMANO = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-40 w-40',
} as const;

/** Clase base de la caja que enmarca la miniatura. */
export function cajaFoto(tamano: keyof typeof TAMANO) {
  return `${TAMANO[tamano]} shrink-0 rounded-md border border-border bg-muted/40 overflow-hidden flex items-center justify-center`;
}

/** Visor de la fotografía completa de un artículo, con su código y descripción. */
export function FotoArticuloDialog({
  open,
  onOpenChange,
  codigo,
  descripcion,
  imagen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigo: string;
  descripcion: string;
  imagen: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{codigo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        <FotoZoom
          src={imagen}
          alt={`Fotografía del artículo ${codigo}`}
          className="h-[60vh]"
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Miniatura de la fotografía de un artículo a partir de las URL que ya vienen
 * en el renglón (comprobaciones e historial). Se carga de forma diferida, al
 * pulsarla abre la fotografía completa y, sin fotografía o si esta falla, no
 * ocupa espacio en pantalla.
 */
export function ArticuloFoto({
  codigo,
  descripcion,
  miniatura,
  imagen,
  tamano = 'sm',
}: {
  codigo: string;
  descripcion: string;
  miniatura?: string;
  imagen?: string;
  tamano?: keyof typeof TAMANO;
}) {
  const [abierta, setAbierta] = useState(false);
  const [fallida, setFallida] = useState(false);

  const src = miniatura ?? imagen;
  if (!src || fallida) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className={`${cajaFoto(tamano)} cursor-zoom-in focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30`}
        title="Ver la fotografía"
        aria-label={`Ver la fotografía del artículo ${codigo}`}
      >
        <img
          src={src}
          alt={`Fotografía del artículo ${codigo}`}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setFallida(true)}
        />
      </button>

      <FotoArticuloDialog
        open={abierta}
        onOpenChange={setAbierta}
        codigo={codigo}
        descripcion={descripcion}
        imagen={imagen ?? src}
      />
    </>
  );
}
