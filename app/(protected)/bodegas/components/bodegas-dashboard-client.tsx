'use client';

import { useState, useMemo } from 'react'; // useMemo kept for procesoOpciones
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProceso, CONSEJO_TIPO_MAP, TIPO_CONSEJO_CHAR, type TTipoConsejo } from '@/hooks/use-proceso';
import { useAuth } from '@/providers/auth-provider';
import { useBodegasDashboard } from './bodegas-data';
import { TipoConsejoPills } from './tipo-consejo-pills';
import { EstadisticasDashboard } from './estadisticas-dashboard';
import { TablaBodegas } from './tabla-bodegas';

export function BodegasDashboardClient() {
  const { data: proceso, isLoading: isLoadingProceso } = useProceso();
  const { hasPermission } = useAuth();
  const router = useRouter();

  const canCrear = hasPermission('bodegas.ver');

  const [tipoConsejo, setTipoConsejo] = useState<TTipoConsejo | null>(null);

  const procesoOpciones = useMemo(
    () =>
      (proceso?.elecciones ?? []).map((e) => ({
        value: CONSEJO_TIPO_MAP[e.consejo_tipo as 'D' | 'M'],
        label: e.consejo_tipo_text,
      })),
    [proceso],
  );

  const tipoConsejoEfectivo: TTipoConsejo =
    tipoConsejo ??
    (proceso?.elecciones?.[0]?.consejo_tipo
      ? CONSEJO_TIPO_MAP[proceso.elecciones[0].consejo_tipo as 'D' | 'M']
      : 'distrital');

  const tipoChar = TIPO_CONSEJO_CHAR[tipoConsejoEfectivo];

  const { data: dashboard, isLoading, isError, refetch } = useBodegasDashboard(tipoChar);

  if (isLoadingProceso) {
    return (
      <div className="space-y-4 animate-pulse motion-reduce:animate-none" aria-busy="true" aria-label="Cargando bodegas">
        <div className="h-8.5 bg-muted rounded-md w-48" />
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector tipo consejo + acción */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TipoConsejoPills
          opciones={procesoOpciones}
          value={tipoConsejoEfectivo}
          onChange={setTipoConsejo}
          isLoading={isLoadingProceso}
        />
        {canCrear && (
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 self-start sm:self-auto"
            onClick={() => router.push('/bodegas/nueva')}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva Bodega
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <EstadisticasDashboard data={dashboard} isLoading={isLoading} />

      {/* Tabla con filtros integrados */}
      <TablaBodegas
        data={dashboard?.bodegas ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        tipoConsejo={tipoChar}
      />
    </div>
  );
}

