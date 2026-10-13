'use client';

import { useState } from 'react';
import {
  ExternalLink,
  FileCheck2,
  FileText,
  PanelRightClose,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { useDocumentoEstudio } from '../_hooks/use-estudios';
import type { TCualDocumento } from './estudio-badges';

interface EstudioDocumentoPanelProps {
  idEstudio: number;
  idDf: number;
  df: string;
  tieneAprobada: boolean;
  onCerrar: () => void;
}

/**
 * PDF del estudio a la derecha del detalle (no es ventana modal), como la
 * cédula en mecanismos: abre con la propuesta y, si existe, se cambia a la
 * versión aprobada.
 */
export function EstudioDocumentoPanel({
  idEstudio,
  idDf,
  df,
  tieneAprobada,
  onCerrar,
}: EstudioDocumentoPanelProps) {
  const [cual, setCual] = useState<TCualDocumento>('propuesta');
  const {
    data: src,
    isLoading,
    isError,
    refetch,
  } = useDocumentoEstudio(idEstudio, cual);

  return (
    <aside
      className="flex flex-col rounded-lg border border-border bg-card overflow-hidden h-[70vh] xl:h-[calc(100vh-var(--header-height,70px)-2rem)]"
      aria-label={`Documento del estudio · ${df}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
          <p className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
            Distrito federal {idDf}
          </p>
          <p className="text-sm font-semibold text-foreground truncate">{df}</p>
        </div>
        <div
          className="inline-flex rounded-md border border-border p-0.5 bg-background"
          role="group"
          aria-label="Documento a la vista"
        >
          {(
            [
              ['propuesta', 'Propuesta', FileText, true],
              ['aprobada', 'Aprobada', FileCheck2, tieneAprobada],
            ] as const
          ).map(([valor, etiqueta, Icono, existe]) => (
            <Button
              key={valor}
              variant={cual === valor ? 'primary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setCual(valor)}
              disabled={!existe}
              aria-pressed={cual === valor}
            >
              <Icono className="h-3.5 w-3.5" aria-hidden="true" />
              {etiqueta}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {src && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="Abrir el documento en otra pestaña"
            >
              <a href={src} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCerrar}
            aria-label="Cerrar el documento"
          >
            <PanelRightClose className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {isError ? (
          <ErrorState
            title="No se pudo obtener el documento."
            onRetry={() => refetch()}
          />
        ) : isLoading || !src ? (
          <div className="p-4 h-full" aria-busy="true">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <iframe
            key={src}
            src={`${src}#view=Fit&zoom=60`}
            title={`Estudio ${cual} · ${df}`}
            className="w-full h-full border-0"
          />
        )}
      </div>
    </aside>
  );
}
