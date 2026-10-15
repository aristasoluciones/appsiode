'use client';

import { useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { pesoLegible, validarArchivo } from '@/lib/archivos';
import { Button } from '@/components/ui/button';

interface SelectorArchivoProps {
  archivo: File | null;
  /** Recibe el archivo válido, o `null` al quitarlo. */
  onChange: (archivo: File | null) => void;
  /** Recibe el mensaje cuando el archivo no pasa extensión o peso, y `null` al elegir uno válido. */
  onError: (mensaje: string | null) => void;
  limites: { extensiones: readonly string[]; bytes: number };
  /** Texto de la zona de selección: «Selecciona el archivo del INE». */
  etiqueta: string;
  /** Formatos en palabras: «Excel (.xlsx) o csv». */
  descripcion?: string;
  disabled?: boolean;
  icono?: React.ReactNode;
}

/**
 * Zona para elegir un archivo (clic o arrastrar y soltar) y la ficha del
 * elegido, con la revisión de extensión y peso antes de enviarlo. Quien la monta guarda el archivo y el
 * error en su propio estado.
 */
export function SelectorArchivo({
  archivo,
  onChange,
  onError,
  limites,
  etiqueta,
  descripcion,
  disabled,
  icono,
}: SelectorArchivoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Resalta la zona mientras se arrastra un archivo encima.
  const [arrastrando, setArrastrando] = useState(false);

  function seleccionar(file: File | null | undefined) {
    // El input se limpia para que volver a elegir el mismo archivo dispare el cambio.
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    const error = validarArchivo(file, limites);
    onError(error);
    onChange(error ? null : file);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={limites.extensiones.join(',')}
        className="hidden"
        onChange={(e) => seleccionar(e.target.files?.[0])}
      />

      {archivo ? (
        <div className="flex items-center gap-3 border border-border rounded-lg p-4">
          <span className="text-primary shrink-0 [&>svg]:h-8 [&>svg]:w-8">
            {icono ?? <FileText />}
          </span>
          <div className="min-w-0 grow">
            <p className="text-sm font-medium truncate">{archivo.name}</p>
            <p className="text-xs text-muted-foreground">
              {pesoLegible(archivo.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onChange(null);
              onError(null);
            }}
            disabled={disabled}
            aria-label="Quitar el archivo"
          >
            <X />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            if (disabled) return;
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastrando(false);
            if (!disabled) seleccionar(e.dataTransfer.files?.[0]);
          }}
          disabled={disabled}
          className={[
            'flex w-full flex-col items-center justify-center gap-2 border border-dashed rounded-lg py-10 text-center hover:bg-accent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
            arrastrando ? 'border-primary bg-primary/5' : 'border-input',
          ].join(' ')}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">{etiqueta}</span>
          <span className="text-xs text-muted-foreground">
            o arrástralo aquí
          </span>
          <span className="text-xs text-muted-foreground">
            {descripcion ??
              `${limites.extensiones.join(', ')} · hasta ${pesoLegible(limites.bytes)}`}
          </span>
        </button>
      )}
    </>
  );
}
