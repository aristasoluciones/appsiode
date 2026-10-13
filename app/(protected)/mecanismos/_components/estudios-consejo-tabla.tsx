'use client';

import { FilePen, FileText, History } from 'lucide-react';
import type { IEstudioConsejo } from '@/types/mecanismos';
import { BotonAccion } from '@/components/common/boton-accion';
import { EstudioBadge, RevisionBadge } from './estudio-badges';

interface EstudiosConsejoTablaProps {
  estudios: IEstudioConsejo[];
  /** Estudio abierto abajo (detalle y documento); su renglón queda resaltado. */
  seleccionadoId: number | null;
  /** Con el PDF abierto a la derecha: alto fijo con scroll propio. */
  compacto?: boolean;
  onAbrir: (e: IEstudioConsejo) => void;
  /** Abre la revisión; ausente = sin permiso. */
  onRevisar?: (e: IEstudioConsejo) => void;
  onHistorial: (e: IEstudioConsejo) => void;
}

const COLUMNAS =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.6fr)_auto] gap-3 items-center';

/**
 * Estudios del consejo en tabla (casi siempre uno): distrito, estatus, la
 * revisión del propio consejo y sus acciones. Sin el avance de los demás
 * consejos, que al consejo no le hace falta.
 */
export function EstudiosConsejoTabla({
  estudios,
  seleccionadoId,
  compacto = false,
  onAbrir,
  onRevisar,
  onHistorial,
}: EstudiosConsejoTablaProps) {
  return (
    <div
      className={[
        'rounded-lg border border-border bg-card overflow-auto',
        // Junto al PDF: mismo alto que el panel y scroll propio; el encabezado queda fijo.
        compacto ? 'xl:max-h-[calc(100vh-var(--header-height,70px)-2rem)]' : '',
      ].join(' ')}
    >
      <div className="min-w-[520px]">
        <div
          className={`${COLUMNAS} sticky top-0 z-10 py-2 px-4 text-xs font-medium text-muted-foreground border-b border-border bg-muted`}
        >
          <div>Distrito federal</div>
          <div>Estatus</div>
          <div>Revisión de tu consejo</div>
          <div className="text-right">Acciones</div>
        </div>
        {estudios.map((e) => {
          const seleccionado = e.id != null && e.id === seleccionadoId;
          return (
            <div
              key={e.id_df}
              onClick={() => e.id && onAbrir(e)}
              aria-current={seleccionado ? 'true' : undefined}
              className={[
                `${COLUMNAS} py-3 px-4 text-sm border-b border-border last:border-b-0 transition-colors`,
                e.id ? 'cursor-pointer hover:bg-accent/30' : '',
                seleccionado ? 'bg-primary/5' : '',
              ].join(' ')}
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">
                  {e.id_df}. {e.df}
                </p>
              </div>
              <div>
                <EstudioBadge estatus={e.estatus} />
              </div>
              <div>
                {e.id ? (
                  <>
                    <RevisionBadge estatus={e.estatus_revision} />
                    <p className="text-[0.6875rem] text-muted-foreground mt-0.5">
                      {/* «Sin observaciones» no cuenta: revisado con 0 es un resultado, no un pendiente. */}
                      {e.total_observaciones === 0
                        ? e.estatus_revision === 'REVISADO'
                          ? 'Sin observaciones'
                          : 'Aún sin observaciones'
                        : `${e.total_observaciones} ${e.total_observaciones === 1 ? 'observación' : 'observaciones'}`}
                    </p>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Oficina central todavía no propone el estudio.
                  </span>
                )}
              </div>
              {/* Las acciones no abren el estudio de abajo por sí solas. */}
              <div
                className="flex items-center justify-end gap-1"
                onClick={(ev) => ev.stopPropagation()}
              >
                {e.puede_revisar && onRevisar && (
                  <BotonAccion
                    etiqueta="Revisar estudio"
                    onClick={() => onRevisar(e)}
                  >
                    <FilePen
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    />
                  </BotonAccion>
                )}
                {e.id && (
                  <>
                    <BotonAccion
                      etiqueta="Ver documentos"
                      onClick={() => onAbrir(e)}
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </BotonAccion>
                    <BotonAccion
                      etiqueta="Historial"
                      onClick={() => onHistorial(e)}
                    >
                      <History className="h-4 w-4" aria-hidden="true" />
                    </BotonAccion>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
