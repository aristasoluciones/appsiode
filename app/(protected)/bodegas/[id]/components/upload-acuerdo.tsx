'use client';

import { useRef } from 'react';
import { FileText, Loader2, Upload, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAcuerdoBodega, useSubirAcuerdo } from '../../components/bodegas-data';

interface UploadAcuerdoProps {
  idBodega: number;
}

export function UploadAcuerdo({ idBodega }: UploadAcuerdoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: acuerdo, isLoading } = useAcuerdoBodega(idBodega);
  const subirMutation = useSubirAcuerdo(idBodega);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF.');
      return;
    }
    subirMutation.mutate(file);
    // Limpiar el input para permitir re-subir el mismo archivo
    e.target.value = '';
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
      {acuerdo ? (
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
            aria-label="Ver acuerdo"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No se ha cargado ningún acuerdo todavía.
        </p>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          aria-label="Seleccionar archivo PDF del acuerdo"
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
          {acuerdo ? 'Reemplazar acuerdo' : 'Subir acuerdo (PDF)'}
        </Button>
      </div>
    </div>
  );
}
