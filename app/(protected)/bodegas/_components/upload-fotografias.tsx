'use client';

import { useRef } from 'react';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFotografiasBodega, useSubirFotografias } from '../_hooks/use-bodegas';
import type { TComponenteFoto } from '@/types/bodegas';

interface UploadFotografiasProps {
  idBodega: number;
  componente: TComponenteFoto;
  etapa?: string;
}

const TIPOS_IMAGEN_ACEPTADOS = 'image/jpeg,image/png,image/webp';

export function UploadFotografias({ idBodega, componente, etapa }: UploadFotografiasProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: fotos = [], isLoading } = useFotografiasBodega(idBodega, componente, etapa);
  const subirMutation = useSubirFotografias(idBodega);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    subirMutation.mutate({ files });
    e.target.value = '';
  }

  return (
    <div className="space-y-4">
      {/* Galería de fotos existentes */}
      {isLoading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          aria-busy="true"
          aria-label="Cargando fotografías"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : fotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
          <ImageIcon
            className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2"
            aria-hidden="true"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay fotografías para el componente {componente}
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          role="list"
          aria-label={`Fotografías del componente ${componente}`}
        >
          {fotos.map((foto) => (
            <figure
              key={foto.id}
              role="listitem"
              className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 relative group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.ruta_archivo}
                alt={`Fotografía ${foto.tipo} — ${foto.componente}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <figcaption className="absolute bottom-0 inset-x-0 p-1.5 bg-black/50 text-white text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                {foto.tipo}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* Input de carga */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={TIPOS_IMAGEN_ACEPTADOS}
          multiple
          className="sr-only"
          aria-label="Seleccionar fotografías"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-[44px] gap-1.5"
          onClick={() => inputRef.current?.click()}
          disabled={subirMutation.isPending}
          aria-busy={subirMutation.isPending}
        >
          {subirMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          Agregar fotografías
        </Button>
      </div>
    </div>
  );
}
