'use client';

import { useRef, useState } from 'react';
import { FileText, Loader2, Upload, ExternalLink } from 'lucide-react';
import { useAcuerdoBodega, useSubirAcuerdo } from '../../components/bodegas-data';

interface UploadAcuerdoProps {
  idBodega: number;
}

export function UploadAcuerdo({ idBodega }: UploadAcuerdoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: acuerdo, isLoading } = useAcuerdoBodega(idBodega);
  const subirMutation = useSubirAcuerdo(idBodega);
  const [isDragging, setIsDragging] = useState(false);

  function processFile(file: File) {
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF.');
      return;
    }
    subirMutation.mutate(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
    e.target.value = '';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500" aria-busy="true">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Cargando acuerdo…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Acuerdo cargado */}
      {acuerdo && (
        <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <FileText className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
              {acuerdo.nomenclatura}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">Acuerdo cargado</p>
          </div>
          <a
            href={acuerdo.ruta_archivo}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            aria-label="Ver acuerdo en nueva pestaña"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Zona de arrastre */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Zona de carga de acuerdo PDF. Arrastra un archivo o haz clic para seleccionar."
        onClick={() => !subirMutation.isPending && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !subirMutation.isPending) {
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          subirMutation.isPending
            ? 'pointer-events-none opacity-60 border-border'
            : isDragging
            ? 'border-primary bg-primary/5 cursor-copy'
            : 'border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer',
        ].join(' ')}
      >
        {subirMutation.isPending ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Subiendo…</p>
          </>
        ) : (
          <>
            <Upload
              className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragging
                  ? 'Suelta para cargar'
                  : acuerdo
                  ? 'Reemplazar acuerdo'
                  : 'Cargar acuerdo'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Arrastra o haz clic · Solo PDF
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        aria-hidden="true"
        onChange={handleFileChange}
      />
    </div>
  );
}
