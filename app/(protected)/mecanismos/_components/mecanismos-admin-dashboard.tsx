'use client';

import { useMemo, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  LoaderCircleIcon,
  Plus,
  Settings2,
  Users,
} from 'lucide-react';
import { useProceso } from '@/hooks/use-proceso';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AccessDenied } from '@/components/common/access-denied';
import { ChipFiltro, ConteoChip } from '@/components/common/chip-filtro';
import { ErrorState } from '@/components/common/error-state';
import {
  opcionesTipoConsejo,
  TipoConsejoPills,
} from '@/components/common/tipo-consejo-pills';
import { useSeguimiento } from '../_hooks/use-mecanismos';
import { useDescargarReporteMecanismos } from '../_hooks/use-mecanismos-reportes';
import { CaesAdminDialog } from './caes-admin-dialog';
import { ConfiguracionConsejosDialog } from './configuracion-consejos-dialog';
import { ImportarMecanismosDialog } from './importar-mecanismos-dialog';
import {
  MecanismoVentanas,
  type TVentanaMecanismo,
} from './mecanismo-ventanas';
import { SeguimientoTable, type TFiltroInforme } from './seguimiento-table';

/** Ventanas del tablero que no son de un mecanismo en particular. */
type TVentanaTablero = 'importar' | 'caes' | 'configuracion' | null;

/**
 * Tablero de oficina central, como el de documentación: todos los consejos del
 * tipo con su avance; al abrir un consejo se ven y se administran sus mecanismos. Las cargas y la configuración salen de aquí.
 */
export function MecanismosAdminDashboard() {
  const { hasPermission } = useAuth();
  const { data: proceso, isLoading: isLoadingProceso } = useProceso();

  const permisosMecanismo = {
    agregar: hasPermission('mecanismos.recoleccion.agregar'),
    editar: hasPermission('mecanismos.recoleccion.editar'),
    baja: hasPermission('mecanismos.recoleccion.baja'),
  };
  // Cargas masivas: formato de mecanismos y zip de cédulas tienen permiso propio.
  const puedeCargasMasivas =
    hasPermission('mecanismos.recoleccion.importar') ||
    hasPermission('mecanismos.recoleccion.cedula.importar');
  // CAE: padrón y asignación en lote tienen permiso propio.
  const puedeCaes =
    hasPermission('mecanismos.recoleccion.caes') ||
    hasPermission('mecanismos.recoleccion.caes.asignar');
  const puedeConfigurar = hasPermission('mecanismos.recoleccion.configuracion');
  const puedeExportar = hasPermission('mecanismos.recoleccion.exportar');
  const puedeSeguimiento = hasPermission('mecanismos.recoleccion.seguimiento');

  const opciones = useMemo(() => opcionesTipoConsejo(proceso), [proceso]);
  const [tipoElegido, setTipoElegido] = useState<'D' | 'M' | null>(null);
  const tipoConsejo = tipoElegido ?? opciones[0]?.value ?? null;

  const [ventana, setVentana] = useState<TVentanaTablero>(null);
  const [ventanaMecanismo, setVentanaMecanismo] =
    useState<TVentanaMecanismo>(null);
  const [filtroInforme, setFiltroInforme] = useState<TFiltroInforme | null>(
    null,
  );

  const seguimiento = useSeguimiento(
    tipoConsejo,
    !isLoadingProceso && puedeSeguimiento,
  );
  const exportar = useDescargarReporteMecanismos();
  const consejos = useMemo(() => seguimiento.data ?? [], [seguimiento.data]);
  const conteos = useMemo(
    () => ({
      conMecanismos: consejos.filter((c) => c.mecanismos > 0).length,
      sinMecanismos: consejos.filter((c) => c.mecanismos === 0).length,
    }),
    [consejos],
  );

  const alternarFiltro = (v: TFiltroInforme) =>
    setFiltroInforme((f) => (f === v ? null : v));

  const cerrar = (v: boolean) => !v && setVentana(null);

  if (isLoadingProceso) {
    return (
      <div
        className="space-y-4"
        aria-busy="true"
        aria-label="Cargando mecanismos"
      >
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-8.5 w-48 rounded-md" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!puedeSeguimiento) {
    return (
      <AccessDenied description="Tu cuenta no tiene el permiso de seguimiento de mecanismos; pide a un administrador que lo asigne." />
    );
  }

  if (seguimiento.isError) {
    return (
      <ErrorState
        title="No se pudo cargar el seguimiento."
        onRetry={() => seguimiento.refetch()}
      />
    );
  }

  const acciones = (
    <>
      {puedeCargasMasivas && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setVentana('importar')}
        >
          <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
          Cargas masivas
        </Button>
      )}
      {puedeCaes && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setVentana('caes')}
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          CAE
        </Button>
      )}
      {puedeConfigurar && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setVentana('configuracion')}
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          Configurar captura
        </Button>
      )}
      {puedeExportar && tipoConsejo && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportar.mutate(tipoConsejo)}
          disabled={exportar.isPending}
        >
          {exportar.isPending ? (
            <LoaderCircleIcon
              className="h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          Exportar
        </Button>
      )}
      {permisosMecanismo.agregar && (
        <Button
          size="sm"
          onClick={() => setVentanaMecanismo({ tipo: 'nuevo' })}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo mecanismo
        </Button>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TipoConsejoPills
          opciones={opciones}
          value={tipoConsejo}
          onChange={(v) => {
            setTipoElegido(v);
            setFiltroInforme(null);
          }}
          disabled={seguimiento.isLoading}
        />
        <div
          className="flex flex-wrap gap-1.5 ml-auto"
          role="group"
          aria-label="Filtrar por mecanismos"
        >
          <ChipFiltro
            activo={filtroInforme === 'con_mecanismos'}
            disabled={seguimiento.isLoading}
            onClick={() => alternarFiltro('con_mecanismos')}
          >
            Con mecanismos
            <ConteoChip>{conteos.conMecanismos}</ConteoChip>
          </ChipFiltro>
          <ChipFiltro
            activo={filtroInforme === 'sin_mecanismos'}
            disabled={seguimiento.isLoading}
            onClick={() => alternarFiltro('sin_mecanismos')}
          >
            Sin mecanismos
            <ConteoChip>{conteos.sinMecanismos}</ConteoChip>
          </ChipFiltro>
        </div>
      </div>

      {tipoConsejo && (
        <div
          className={[
            'transition-opacity duration-150 motion-reduce:transition-none',
            seguimiento.isFetching && !seguimiento.isLoading
              ? 'opacity-60'
              : 'opacity-100',
          ].join(' ')}
        >
          <SeguimientoTable
            data={consejos}
            isLoading={seguimiento.isLoading}
            tipoConsejo={tipoConsejo}
            filtroInforme={filtroInforme}
            onLimpiarFiltro={() => setFiltroInforme(null)}
            acciones={acciones}
          />
        </div>
      )}

      <MecanismoVentanas
        ventana={ventanaMecanismo}
        onChange={setVentanaMecanismo}
        permisos={permisosMecanismo}
      />

      <ImportarMecanismosDialog
        open={ventana === 'importar'}
        onOpenChange={cerrar}
      />

      {tipoConsejo && (
        <>
          <CaesAdminDialog
            open={ventana === 'caes'}
            onOpenChange={cerrar}
            tipoConsejo={tipoConsejo}
            consejos={consejos}
          />
          <ConfiguracionConsejosDialog
            open={ventana === 'configuracion'}
            onOpenChange={cerrar}
            tipoConsejo={tipoConsejo}
          />
        </>
      )}
    </div>
  );
}
