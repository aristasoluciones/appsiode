'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EstadoVacio } from '@/components/common/estado-vacio';
import { useEstudiosConsejo } from '../_hooks/use-estudios';
import { EstudioDocumentoPanel } from './estudio-documento-panel';
import { EstudioVentanas, type TVentanaEstudio } from './estudio-ventanas';
import { EstudiosConsejoTabla } from './estudios-consejo-tabla';
import { RevisionEstudioPanel } from './revision-estudio-panel';

interface EstudiosConsejoContainerProps {
  tipoConsejo: 'D' | 'M';
  idConsejo: number;
}

/** Fija el panel del documento bajo el encabezado de la página en pantallas anchas. */
const STICKY =
  'xl:sticky xl:top-[calc(var(--header-height,70px)+1rem)] xl:self-start';

/**
 * Estudios de factibilidad de los distritos federales del consejo, en tabla.
 * Al abrir uno, como la cédula en mecanismos: la tabla a la izquierda y el
 * PDF fijo a la derecha; el historial va en su propia ventana.
 */
export function EstudiosConsejoContainer({
  tipoConsejo,
  idConsejo,
}: EstudiosConsejoContainerProps) {
  const { hasPermission } = useAuth();
  const puedeRevisar = hasPermission('mecanismos.factibilidad.revisar');

  const { data, isLoading, isFetching, isError, refetch } = useEstudiosConsejo(
    tipoConsejo,
    idConsejo,
  );
  const [ventana, setVentana] = useState<TVentanaEstudio>(null);
  const [abiertoId, setAbiertoId] = useState<number | null>(null);
  // Revisión en modo enfocado: oculta la tabla y deja el formulario junto al PDF del mismo estudio.
  const [revisandoId, setRevisandoId] = useState<number | null>(null);

  const estudios = data ?? [];
  const pendientes = estudios.filter((e) => e.puede_revisar).length;
  const abierto = estudios.find((e) => e.id === abiertoId) ?? null;
  const revisando = estudios.find((e) => e.id === revisandoId) ?? null;

  if (isError) {
    return (
      <ErrorState
        title="No se pudieron cargar los estudios."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendientes > 0 && (
        <Alert variant="info" icon="info" appearance="light">
          <AlertIcon>
            <Info />
          </AlertIcon>
          <AlertTitle>
            {pendientes === 1
              ? 'Hay un estudio pendiente de revisar.'
              : `Hay ${pendientes} estudios pendientes de revisar.`}{' '}
            Revisa el documento, registra tus observaciones y, cuando lo
            consideres, márcalo como revisado.
          </AlertTitle>
        </Alert>
      )}

      {/* Como la cédula en mecanismos: la tabla a la izquierda y el PDF fijo a la derecha. */}
      <div
        className={
          abierto?.id
            ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,48%)] items-start'
            : ''
        }
      >
        {abierto?.id && (
          <div className={`xl:order-2 ${STICKY}`}>
            <EstudioDocumentoPanel
              key={abierto.id}
              idEstudio={abierto.id}
              idDf={abierto.id_df}
              df={abierto.df}
              tieneAprobada={abierto.tiene_aprobada}
              onCerrar={() => {
                setAbiertoId(null);
                setRevisandoId(null);
              }}
            />
          </div>
        )}
        {/* Solo la lista se atenúa al recargar; el PDF no parpadea. */}
        <div
          className={[
            'min-w-0 space-y-4 transition-opacity duration-150 motion-reduce:transition-none',
            isFetching ? 'opacity-60' : 'opacity-100',
            abierto?.id ? STICKY : '',
          ].join(' ')}
        >
          {/* Modo enfocado: mientras se revisa, la tabla se oculta y solo queda la revisión junto al PDF. */}
          {revisando ? (
            <RevisionEstudioPanel
              key={revisando.id}
              objetivo={{
                id: revisando.id!,
                idDf: revisando.id_df,
                df: revisando.df,
              }}
              onCerrar={() => setRevisandoId(null)}
            />
          ) : estudios.length === 0 ? (
            <EstadoVacio
              titulo="Sin distrito federal asignado"
              descripcion="El consejo no aparece en el marco geográfico de ningún distrito federal."
            />
          ) : !estudios.some((e) => e.id) ? (
            // Sin ningún estudio propuesto no hay nada que revisar: ni tabla ni revisión.
            <EstadoVacio
              titulo="Aún no hay estudio de factibilidad"
              descripcion="Oficina central todavía no propone el estudio de tu distrito federal. Cuando lo haga, aquí podrás consultarlo y registrar tus observaciones."
            />
          ) : (
            <EstudiosConsejoTabla
              compacto={!!abierto?.id}
              estudios={estudios}
              seleccionadoId={abiertoId}
              onAbrir={(e) => setAbiertoId(e.id)}
              onRevisar={
                puedeRevisar
                  ? (e) => {
                      if (!e.id) return;
                      setAbiertoId(e.id);
                      setRevisandoId(e.id);
                    }
                  : undefined
              }
              onHistorial={(e) =>
                e.id && setVentana({ tipo: 'historial', id: e.id })
              }
            />
          )}
        </div>
      </div>

      <EstudioVentanas ventana={ventana} onChange={setVentana} />
    </div>
  );
}
