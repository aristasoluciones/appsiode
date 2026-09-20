'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/common/error-state';
import { EstadoVacio } from '@/components/common/estado-vacio';
import { useEstudiosConsejo } from '../_hooks/use-estudios';
import { EstudioCard } from './estudio-card';
import {
  EstudioVentanas,
  useVisorEstudio,
  type TVentanaEstudio,
} from './estudio-ventanas';

interface EstudiosConsejoContainerProps {
  tipoConsejo: 'D' | 'M';
  idConsejo: number;
}

/**
 * Estudios de factibilidad de los distritos federales del consejo (casi
 * siempre uno): estatus, documentos, sus dos acuses y el botón de acusar la
 * etapa vigente.
 */
export function EstudiosConsejoContainer({
  tipoConsejo,
  idConsejo,
}: EstudiosConsejoContainerProps) {
  const { hasPermission } = useAuth();
  const puedeAcusar =
    hasPermission('mecanismos.factibilidad.acusar-propuesta') ||
    hasPermission('mecanismos.factibilidad.acusar-aprobacion');

  const { data, isLoading, isFetching, isError, refetch } = useEstudiosConsejo(
    tipoConsejo,
    idConsejo,
  );
  const [ventana, setVentana] = useState<TVentanaEstudio>(null);
  const visorEstudio = useVisorEstudio();

  const estudios = data ?? [];
  const pendientes = estudios.filter(
    (e) => e.puede_acusar_propuesta || e.puede_acusar_aprobacion,
  ).length;

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
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div
      className={[
        'space-y-4 transition-opacity duration-150 motion-reduce:transition-none',
        isFetching ? 'opacity-60' : 'opacity-100',
      ].join(' ')}
    >
      {pendientes > 0 && (
        <Alert variant="info" icon="info" appearance="light">
          <AlertIcon>
            <Info />
          </AlertIcon>
          <AlertTitle>
            {pendientes === 1
              ? 'Hay un acuse pendiente del consejo.'
              : `Hay ${pendientes} acuses pendientes del consejo.`}{' '}
            Revisa el documento y registra el acuse con tus observaciones.
          </AlertTitle>
        </Alert>
      )}

      {estudios.length === 0 ? (
        <EstadoVacio
          titulo="Sin distrito federal asignado"
          descripcion="El consejo no aparece en el marco geográfico de ningún distrito federal."
        />
      ) : (
        estudios.map((e) => (
          <EstudioCard
            key={e.id_df}
            estudio={e}
            onAcusar={
              puedeAcusar
                ? (est, etapa) =>
                    est.id &&
                    setVentana({
                      tipo: 'acusar',
                      id: est.id,
                      df: est.df,
                      etapa,
                    })
                : undefined
            }
            onVerDetalle={(est) =>
              est.id && setVentana({ tipo: 'detalle', id: est.id })
            }
            onVerDocumento={(est, cual) =>
              est.id && visorEstudio.abrir(est.id, est.df, cual)
            }
            documentoPendiente={visorEstudio.pendiente}
          />
        ))
      )}

      <EstudioVentanas ventana={ventana} onChange={setVentana} />
      {visorEstudio.visor}
    </div>
  );
}
