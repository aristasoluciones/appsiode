'use client';

import { ExternalLink, FileText, PanelRightClose, Upload } from 'lucide-react';
import type { IMecanismoLista } from '@/types/mecanismos';
import { formatFechaHora } from '@/lib/fechas';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EstadoVacio } from '@/components/common/estado-vacio';
import { useCedulaArchivo } from '../_hooks/use-mecanismo-cedula';
import { claveMecanismo } from '../_lib/estatus';

interface CedulaPanelProps {
  mecanismo: IMecanismoLista;
  onCerrar: () => void;
  /** Oficina central con permiso: puede cargar o reemplazar el PDF desde el panel. */
  onCargar?: (m: IMecanismoLista) => void;
}

/**
 * Vista previa de la cédula en la misma pantalla, a la derecha de la lista (no
 * es una ventana modal): al elegir otro mecanismo en la lista el panel cambia
 * de PDF, y se cierra con su botón.
 */
export function CedulaPanel({
  mecanismo,
  onCerrar,
  onCargar,
}: CedulaPanelProps) {
  const tieneCedula = mecanismo.tiene_cedula;
  const { data, isLoading, isError, refetch } = useCedulaArchivo(
    mecanismo.id,
    tieneCedula,
  );
  // El API firma la URL en línea: el iframe la muestra directo, sin proxy.
  const src = data ?? null;

  return (
    <aside
      className="flex flex-col rounded-lg border border-border bg-card overflow-hidden h-[70vh] xl:h-[calc(100vh-8rem)] xl:sticky xl:top-4"
      aria-label={`Cédula del mecanismo ${claveMecanismo(mecanismo)}`}
    >
      <header className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText
            className="h-4 w-4 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Cédula · {claveMecanismo(mecanismo)}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {tieneCedula && mecanismo.cedula_fecha
                ? `Cargada el ${formatFechaHora(mecanismo.cedula_fecha)}`
                : tieneCedula
                  ? 'PDF de la cédula del mecanismo'
                  : 'Sin cédula cargada'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onCargar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCargar(mecanismo)}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {tieneCedula ? 'Reemplazar' : 'Cargar'}
            </Button>
          )}
          {src && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="Abrir la cédula en otra pestaña"
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
            aria-label="Cerrar la vista previa"
          >
            <PanelRightClose className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {!tieneCedula ? (
          <EstadoVacio
            titulo="Sin cédula"
            descripcion={
              onCargar
                ? 'Carga el PDF de la cédula para que los consejos vinculados puedan consultarlo.'
                : 'Oficina central todavía no carga la cédula de este mecanismo.'
            }
          />
        ) : isError ? (
          <ErrorState
            title="No se pudo obtener la cédula."
            onRetry={() => refetch()}
          />
        ) : isLoading || !src ? (
          <div
            className="p-4 h-full"
            aria-busy="true"
            aria-label="Cargando la cédula"
          >
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <iframe
            key={src}
            src={`${src}#view=Fit&zoom=60`}
            title={`Cédula del mecanismo ${claveMecanismo(mecanismo)}`}
            className="w-full h-full border-0"
          />
        )}
      </div>
    </aside>
  );
}
